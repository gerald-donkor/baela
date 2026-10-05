import { eq } from "drizzle-orm";
import { z } from "zod";
import { withDb } from "@/lib/db";
import { courses, assets } from "@/lib/db/schema";
import { signedAsset } from "@/lib/server/imagekit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success || !process.env.DATABASE_URL)
    return new Response(null, { status: 404 });
  const asset = await withDb(async (db) => {
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, id),
    });
    if (!course?.coverId || course.status === "draft") return null;
    return db.query.assets.findFirst({ where: eq(assets.id, course.coverId) });
  });
  if (!asset?.ready || asset.kind !== "image")
    return new Response(null, { status: 404 });
  return new Response(null, {
    status: 302,
    headers: {
      Location: signedAsset(asset.filePath, 300, "h-480,w-800"),
      "Cache-Control": "private, no-store",
    },
  });
}
