import "server-only";
import { sql } from "drizzle-orm";
import { withDb } from "@/lib/db";
import { rateLimits } from "@/lib/db/schema";
import { HttpError } from "@/lib/http";
export async function rateLimit(key: string, limit: number, seconds = 60) {
  const now = new Date(),
    expiresAt = new Date(now.getTime() + seconds * 1000);
  const row = await withDb(
    async (db) =>
      (
        await db
          .insert(rateLimits)
          .values({ key, hits: 1, expiresAt })
          .onConflictDoUpdate({
            target: rateLimits.key,
            set: {
              hits: sql`case when ${rateLimits.expiresAt} < ${now} then 1 else ${rateLimits.hits}+1 end`,
              expiresAt: sql`case when ${rateLimits.expiresAt} < ${now} then ${expiresAt} else ${rateLimits.expiresAt} end`,
            },
          })
          .returning()
      )[0],
  );
  if (row.hits > limit)
    throw new HttpError(
      429,
      "Too many requests. Please wait a moment and try again.",
    );
}
