import { webhooks } from "@polar-sh/sdk/2026-04";
import { after } from "next/server";
import { withDb } from "@/lib/db";
import { webhookEvents } from "@/lib/db/schema";
import { required } from "@/lib/config";
import { enqueue, runJobs } from "@/lib/server/jobs";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > 1_000_000)
    return new Response("Too large", { status: 413 });
  try {
    await webhooks.validateEvent(
      body,
      Object.fromEntries(request.headers),
      required("POLAR_WEBHOOK_SECRET"),
    );
  } catch {
    return new Response("Invalid signature", { status: 403 });
  }
  const payload = JSON.parse(body) as Record<string, unknown>;
  const id = request.headers.get("webhook-id");
  if (!id || typeof payload.type !== "string")
    return new Response("Invalid event", { status: 400 });
  await withDb((db) =>
    db.transaction(async (tx) => {
      await tx
        .insert(webhookEvents)
        .values({ id, type: payload.type as string, payload })
        .onConflictDoNothing();
      await enqueue(tx, "webhook", "webhook:" + id, { eventId: id });
    }),
  );
  after(() => runJobs(3));
  return new Response(null, { status: 202 });
}
