import "server-only";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { after } from "next/server";
import { HttpError } from "@/lib/http";
import { requireUser } from "@/lib/auth/server";
import { withDb } from "@/lib/db";
import { orders, refundRequests, users } from "@/lib/db/schema";
import { enqueue, runJobs } from "@/lib/server/jobs";
import { polarApi } from "@/lib/server/polar";
import { rateLimit } from "@/lib/server/rate-limit";
import { site } from "@/lib/config";
export async function executeAccountCommand(input: unknown) {
  const user = await requireUser(true);
  await rateLimit("account:" + user.id, 20);
  const data = z
    .discriminatedUnion("action", [
      z.object({ action: z.literal("portal") }),
      z.object({
        action: z.literal("refund"),
        orderId: z.string(),
        reason: z.string().trim().min(10).max(2000),
      }),
      z.object({
        action: z.literal("delete"),
        confirmation: z.literal("DELETE"),
      }),
    ])
    .parse(input);
  if (data.action === "portal")
    return z.object({ customer_portal_url: z.url() }).parse(
      await polarApi("/customer-sessions/", "POST", {
        external_customer_id: user.id,
        return_url: site.url + "/account",
      }),
    );
  if (data.action === "refund")
    return withDb(async (db) => {
      const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, data.orderId), eq(orders.userId, user.id)),
      });
      if (!order || !order.paid || order.refunded >= order.amount)
        throw new HttpError(
          400,
          "This order is not eligible for a new request.",
        );
      const [row] = await db
        .insert(refundRequests)
        .values({ userId: user.id, orderId: order.id, reason: data.reason })
        .onConflictDoNothing()
        .returning();
      if (!row)
        throw new HttpError(
          409,
          "A request for this order is already pending.",
        );
      return { saved: true };
    });
  if (user.admin)
    throw new HttpError(
      409,
      "The sole administrator account cannot be deleted here.",
    );
  const sessionAge = Date.now() - new Date(user.sessionCreatedAt).getTime();
  if (
    !Number.isFinite(sessionAge) ||
    sessionAge < 0 ||
    sessionAge > 10 * 60 * 1000
  )
    throw new HttpError(
      403,
      "Sign out and sign in again before deleting your account.",
    );
  await withDb((db) =>
    db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${user.id}))`);
      await tx
        .update(users)
        .set({ state: "deleting" })
        .where(eq(users.id, user.id));
      await enqueue(tx, "delete_account", "delete:" + user.id, {
        userId: user.id,
      });
    }),
  );
  after(() => runJobs(2));
  return { pending: true };
}
