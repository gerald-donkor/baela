import { z } from "zod";
import { endpoint, sameOrigin, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/server";
import {
  imagekit,
  signedAsset,
  isImageKitConfigured,
  imagekitPublicKey,
  imagekitUploadFolder,
} from "@/lib/server/imagekit";
import { withDb } from "@/lib/db";
import { assets } from "@/lib/db/schema";
import { uploadLimits } from "@/lib/config";
import { streamingLadder } from "@/lib/domain/media";
import { eq } from "drizzle-orm";
export async function POST(request: Request) {
  return endpoint(async () => {
    sameOrigin(request);
    await requireAdmin();
    if (!isImageKitConfigured())
      throw new HttpError(
        503,
        "ImageKit uploads are not configured yet. Add the ImageKit keys and URL endpoint, then restart the application.",
      );
    const data = z
      .discriminatedUnion("action", [
        z.object({ action: z.literal("authorize") }),
        z.object({
          action: z.literal("register"),
          fileId: z.string().min(1),
          kind: z.enum(["video", "image", "attachment"]),
        }),
        z.object({ action: z.literal("verify"), id: z.uuid() }),
        z.object({ action: z.literal("preview"), id: z.uuid() }),
      ])
      .parse(await request.json());
    if (data.action === "authorize")
      return {
        // The installed SDK signs an absolute Unix timestamp, not a duration.
        ...imagekit().helper.getAuthenticationParameters(
          undefined,
          Math.floor(Date.now() / 1000) + 300,
        ),
        publicKey: imagekitPublicKey(),
        folder: imagekitUploadFolder(),
      };
    if (data.action === "preview")
      return withDb(async (db) => {
        const asset = await db.query.assets.findFirst({
          where: eq(assets.id, data.id),
        });
        if (!asset || asset.kind !== "image" || !asset.ready || !asset.private)
          throw new HttpError(404, "Image not found.");
        return { url: signedAsset(asset.filePath, 300) };
      });
    if (data.action === "verify")
      return withDb(async (db) => {
        const asset = await db.query.assets.findFirst({
          where: eq(assets.id, data.id),
        });
        if (!asset) throw new HttpError(404, "Asset not found.");
        let duration = asset.duration,
          height = asset.height;
        if (asset.kind === "video") {
          const metadata = await imagekit().files.metadata.get(asset.fileId);
          duration = Math.round(metadata.duration || 0);
          height = Math.floor(metadata.height || 0);
          if (!duration || !height)
            throw new HttpError(
              409,
              "Video metadata is still processing. Try again shortly.",
            );
          const ladder = streamingLadder(height);
          const response = await fetch(
            signedAsset(
              asset.filePath + (ladder ? "/ik-master.m3u8" : ""),
              300,
              ladder || undefined,
            ),
            {
              method: ladder ? "GET" : "HEAD",
              cache: "no-store",
              signal: AbortSignal.timeout(20000),
            },
          );
          if (response.status === 202) return { ready: false };
          if (
            !response.ok ||
            (ladder && !(await response.text()).startsWith("#EXTM3U"))
          )
            throw new HttpError(
              409,
              "Video processing is not ready. Try again shortly.",
            );
        }
        await db
          .update(assets)
          .set({ ready: true, duration, height })
          .where(eq(assets.id, asset.id));
        return { ready: true };
      });
    const file = await imagekit().files.get(data.fileId);
    const metadata = z
      .object({
        fileId: z.string(),
        filePath: z.string(),
        name: z.string(),
        size: z.number(),
        isPrivateFile: z.boolean(),
        mime: z.string().optional(),
        fileType: z.string(),
        duration: z.number().optional(),
      })
      .parse(file);
    if (
      !metadata.filePath.startsWith(
        imagekitUploadFolder() + "/" + data.kind + "/",
      ) ||
      !metadata.isPrivateFile ||
      metadata.size > uploadLimits[data.kind]
    )
      throw new HttpError(
        400,
        "Upload must be private and within the file-size limit.",
      );
    const extension = metadata.name.split(".").pop()?.toLowerCase();
    const allowed = {
      video: ["mp4"],
      image: ["jpg", "jpeg", "png", "webp"],
      attachment: ["pdf", "zip", "pptx"],
    };
    if (!extension || !allowed[data.kind].includes(extension))
      throw new HttpError(400, "Unsupported file format.");
    let duration = metadata.duration || 0,
      height = 0;
    if (data.kind === "video") {
      const details = await imagekit().files.metadata.get(data.fileId);
      height = Math.floor(details.height || 0);
      const parsed = z
        .object({ duration: z.number().optional() })
        .safeParse(details);
      duration = parsed.success ? parsed.data.duration || duration : duration;
    }
    const [asset] = await withDb((db) =>
      db
        .insert(assets)
        .values({
          fileId: metadata.fileId,
          filePath: metadata.filePath,
          name: metadata.name,
          kind: data.kind,
          size: metadata.size,
          mime: metadata.mime || "application/octet-stream",
          duration: Math.round(duration),
          height,
          ready: data.kind !== "video",
          private: true,
        })
        .onConflictDoUpdate({
          target: assets.fileId,
          set: { duration: Math.round(duration), height },
        })
        .returning(),
    );
    return asset;
  });
}
