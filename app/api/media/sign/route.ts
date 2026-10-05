import { createHash } from "node:crypto";
import { z } from "zod";
import { endpoint, sameOrigin, HttpError } from "@/lib/http";
import { getViewer, requireAdmin } from "@/lib/auth/server";
import { withDb } from "@/lib/db";
import { authorizedLesson, assetById } from "@/lib/server/catalog";
import { allowedMediaUrl, streamingLadder } from "@/lib/domain/media";
import { signedAsset } from "@/lib/server/imagekit";
import { eq } from "drizzle-orm";
import { lessons, revisions } from "@/lib/db/schema";
import { required } from "@/lib/config";
import { rateLimit } from "@/lib/server/rate-limit";
const input = z.object({
  lessonId: z.uuid(),
  assetId: z.uuid().optional(),
  url: z.url().optional(),
  hls: z.boolean().optional(),
  draft: z.boolean().optional(),
});
export async function POST(request: Request) {
  return endpoint(async () => {
    sameOrigin(request);
    const data = input.parse(await request.json());
    const user = await getViewer();
    if (user && user.state !== "active")
      throw new HttpError(403, "Account unavailable.");
    await rateLimit(
      "media:" +
        (user?.id ||
          "preview:" +
            createHash("sha256")
              .update(
                (process.env.NEON_AUTH_COOKIE_SECRET || "local") +
                  new Date().toISOString().slice(0, 10) +
                  (process.env.VERCEL
                    ? request.headers.get("x-vercel-forwarded-for") || "unknown"
                    : "local"),
              )
              .digest("hex")),
      600,
    );
    return withDb(async (db) => {
      const row = await (async () => {
        if (!data.draft)
          return authorizedLesson(db, data.lessonId, user?.id, user?.admin);
        await requireAdmin();
        const lesson = await db.query.lessons.findFirst({
          where: eq(lessons.id, data.lessonId),
        });
        const revision = lesson?.draftRevisionId
          ? await db.query.revisions.findFirst({
              where: eq(revisions.id, lesson.draftRevisionId),
            })
          : null;
        if (!revision) throw new HttpError(404, "Draft not found.");
        return { revision, access: { allowed: true, expiresAt: null } };
      })();
      const assetId = data.assetId || row.revision.videoId;
      if (
        !assetId ||
        ![
          row.revision.videoId,
          ...row.revision.attachmentIds,
          ...row.revision.imageIds,
        ].includes(assetId)
      )
        throw new HttpError(403, "Asset does not belong to this lesson.");
      const asset = await assetById(db, assetId);
      if (!asset || !asset.ready || !asset.private)
        throw new HttpError(409, "This resource is still processing.");
      let path = asset.filePath,
        tr: string | undefined;
      if (data.url) {
        if (
          !allowedMediaUrl(
            data.url,
            required("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT"),
            asset.filePath,
          )
        )
          throw new HttpError(403, "Invalid media resource.");
        const u = new URL(data.url),
          endpointPath = new URL(
            required("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT"),
          ).pathname.replace(/\/$/, "");
        path = u.pathname.slice(endpointPath.length);
        tr = u.searchParams.get("tr") || undefined;
        if (
          tr?.startsWith("sr-") &&
          tr
            .slice(3)
            .split("_")
            .some((height) => Number(height) > asset.height)
        )
          throw new HttpError(
            403,
            "Requested video quality exceeds the source resolution.",
          );
      } else if (
        data.hls &&
        asset.kind === "video" &&
        streamingLadder(asset.height)
      ) {
        path += "/ik-master.m3u8";
        tr = streamingLadder(asset.height)!;
      }
      const expiresIn = row.access.expiresAt
        ? Math.max(
            1,
            Math.min(
              300,
              Math.floor((row.access.expiresAt.getTime() - Date.now()) / 1000),
            ),
          )
        : 300;
      return {
        url: signedAsset(path, expiresIn, tr),
        expiresIn,
        duration: asset.duration,
        hls: path.endsWith(".m3u8"),
      };
    });
  });
}
