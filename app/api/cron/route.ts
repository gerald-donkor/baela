import { timingSafeEqual } from "node:crypto";
import { withDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { runJobs } from "@/lib/server/jobs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const expected = Buffer.from("Bearer " + process.env.CRON_SECRET),
    actual = Buffer.from(request.headers.get("authorization") || "");
  if (
    !process.env.CRON_SECRET ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  )
    return new Response("Unauthorized", { status: 401 });
  const result = await runJobs();
  await withDb(async (db) => {
    await db.execute(sql`delete from rate_limits where expires_at < now()`);
    await db.execute(
      sql`delete from playback_sessions where created_at < now() - interval '30 days'`,
    );
    await db.execute(
      sql`delete from jobs where done_at < now() - interval '30 days'`,
    );
    await db.execute(
      sql`update webhook_events set payload = '{}'::jsonb where processed_at < now() - interval '30 days' and payload <> '{}'::jsonb`,
    );
  });
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
