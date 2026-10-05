import "server-only";
import { and, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { withDb, type Db } from "@/lib/db";
import {
  jobs,
  webhookEvents,
  users,
  offers,
  orders,
  subscriptions,
  entitlements,
  progress,
  playbackSessions,
  refundRequests,
  checkoutIntents,
} from "@/lib/db/schema";
import {
  polarApi,
  providerOrder,
  providerProduct,
  providerSubscription,
  providerPeriod,
  offerPrice,
} from "./polar";
import { required } from "@/lib/config";
import { isFullRefund } from "@/lib/domain/access";
import { revalidateTag } from "next/cache";
import { JobBudgetExceeded, providerSignal, withJobBudget } from "./job-budget";

class DeferredJob extends Error {
  constructor(public nextRun: Date) {
    super("Waiting for pending checkout to settle before account deletion.");
  }
}
export async function enqueue(
  db: Db,
  type: typeof jobs.$inferInsert.type,
  key: string,
  payload: Record<string, string>,
) {
  await db
    .insert(jobs)
    .values({ type, key, payload })
    .onConflictDoNothing({ target: jobs.key });
}
async function handleEvent(eventId: string) {
  const event = await withDb((db) =>
    db.query.webhookEvents.findFirst({ where: eq(webhookEvents.id, eventId) }),
  );
  if (!event || event.processedAt) return;
  const data = z.object({ id: z.string() }).parse(event.payload.data);
  if (event.type.startsWith("product.")) {
    const product = providerProduct.parse(
      await polarApi("/products/" + encodeURIComponent(data.id)),
    );
    await withDb(async (db) => {
      const mapped = await db
        .select()
        .from(offers)
        .where(eq(offers.productId, product.id));
      for (const offer of mapped) {
        const price = offerPrice(product, offer.kind);
        await db
          .update(offers)
          .set({
            active: !!price,
            ...(price
              ? { amount: price.price_amount!, currency: price.price_currency! }
              : {}),
          })
          .where(eq(offers.id, offer.id));
      }
    });
    revalidateTag("catalog", "max");
  } else if (event.type.startsWith("order.")) {
    const order = providerOrder.parse(
      await polarApi("/orders/" + encodeURIComponent(data.id)),
    );
    const raw = z
      .object({ subscription: providerPeriod.nullish() })
      .safeParse(event.payload.data);
    const period = raw.success ? raw.data.subscription : undefined;
    const subscription = order.subscription_id
      ? providerSubscription.parse(
          await polarApi(
            "/subscriptions/" + encodeURIComponent(order.subscription_id),
          ),
        )
      : null;
    await withDb((db) =>
      db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${order.customer.id}))`,
        );
        if (!order.customer.external_id) return;
        const user = await tx.query.users.findFirst({
          where: eq(users.id, order.customer.external_id),
        });
        if (!user) return;
        if (user.state === "deleted") {
          if (order.subscription_id)
            await enqueue(
              tx,
              "cancel_subscription",
              "deleted:" + order.subscription_id,
              { subscriptionId: order.subscription_id },
            );
          return;
        }
        const offer = await tx.query.offers.findFirst({
          where: eq(offers.productId, order.product_id),
        });
        if (!offer)
          throw new Error("Unmapped Polar product: " + order.product_id);
        const previous = await tx.query.orders.findFirst({
          where: eq(orders.id, order.id),
        });
        const modified = order.modified_at || order.created_at;
        if (previous && previous.providerUpdatedAt > modified) return;
        // Refund totals never decrease when an old delivery is replayed.
        const refunded = Math.max(
          previous?.refunded || 0,
          order.refunded_amount,
        );
        await tx
          .insert(orders)
          .values({
            id: order.id,
            userId: user.id,
            offerId: offer.id,
            checkoutId: order.checkout_id,
            subscriptionId: order.subscription_id,
            amount: order.net_amount,
            refunded,
            currency: order.currency,
            paid: order.paid,
            providerUpdatedAt: modified,
            createdAt: order.created_at,
          })
          .onConflictDoUpdate({
            target: orders.id,
            set: { refunded, paid: order.paid, providerUpdatedAt: modified },
          });
        await tx
          .update(users)
          .set({ polarCustomerId: order.customer.id })
          .where(eq(users.id, user.id));
        const full =
          isFullRefund(order.net_amount, refunded) ||
          order.status === "refunded";
        const existing = await tx.query.entitlements.findFirst({
          where: eq(entitlements.sourceOrderId, order.id),
        });
        if (full) {
          await tx
            .update(entitlements)
            .set({ revokedAt: new Date() })
            .where(eq(entitlements.sourceOrderId, order.id));
        } else if (order.paid && !existing && user.state === "active") {
          // Paid-period timestamps must originate in the event snapshot, not a newer renewal.
          const paidPeriod = event.type === "order.paid" ? period : null;
          if (
            offer.kind === "monthly" &&
            (!paidPeriod ||
              paidPeriod.current_period_end <= paidPeriod.current_period_start)
          )
            throw new Error(
              "Paid subscription order has no period snapshot; replay its order.paid delivery.",
            );
          const invalidSubscription =
            subscription &&
            ["canceled", "unpaid", "incomplete_expired"].includes(
              subscription.status,
            ) &&
            (!subscription.ends_at || subscription.ends_at <= new Date());
          await tx
            .insert(entitlements)
            .values({
              userId: user.id,
              sourceOrderId: order.id,
              kind: offer.kind,
              courseId: offer.courseId,
              startsAt: paidPeriod?.current_period_start || order.created_at,
              endsAt:
                offer.kind === "monthly"
                  ? paidPeriod!.current_period_end
                  : null,
              revokedAt: invalidSubscription ? new Date() : null,
            })
            .onConflictDoNothing();
          if (offer.kind === "lifetime") {
            const all = await tx
              .select()
              .from(subscriptions)
              .where(eq(subscriptions.userId, user.id));
            for (const sub of all)
              if (!sub.cancelAtPeriodEnd)
                await enqueue(
                  tx,
                  "cancel_subscription",
                  "lifetime:" + order.id + ":" + sub.id,
                  { subscriptionId: sub.id },
                );
          }
        }
        if (refunded > 0)
          await tx
            .update(refundRequests)
            .set({ status: full ? "refunded" : "partial" })
            .where(eq(refundRequests.orderId, order.id));
      }),
    );
  } else if (event.type.startsWith("subscription.")) {
    const sub = providerSubscription.parse(
      await polarApi("/subscriptions/" + encodeURIComponent(data.id)),
    );
    await withDb((db) =>
      db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${sub.customer.id}))`,
        );
        if (!sub.customer.external_id) return;
        const user = await tx.query.users.findFirst({
          where: eq(users.id, sub.customer.external_id),
        });
        if (!user) return;
        if (user.state === "deleted") {
          if (!sub.cancel_at_period_end)
            await enqueue(tx, "cancel_subscription", "deleted:" + sub.id, {
              subscriptionId: sub.id,
            });
          return;
        }
        const modified = sub.modified_at || sub.created_at;
        const previous = await tx.query.subscriptions.findFirst({
          where: eq(subscriptions.id, sub.id),
        });
        if (previous && previous.providerUpdatedAt > modified) return;
        const revoked =
          ["canceled", "unpaid", "incomplete_expired"].includes(sub.status) &&
          (!sub.ends_at || sub.ends_at <= new Date());
        const values = {
          userId: user.id,
          status: sub.status,
          periodStart: sub.current_period_start,
          periodEnd: sub.current_period_end,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          revokedAt: revoked ? new Date() : null,
          providerUpdatedAt: modified,
        };
        await tx
          .insert(subscriptions)
          .values({ id: sub.id, ...values })
          .onConflictDoUpdate({ target: subscriptions.id, set: values });
        if (revoked)
          await tx
            .update(entitlements)
            .set({ revokedAt: new Date() })
            .where(
              inArray(
                entitlements.sourceOrderId,
                tx
                  .select({ id: orders.id })
                  .from(orders)
                  .where(eq(orders.subscriptionId, sub.id)),
              ),
            );
        const lifetime = await tx.query.entitlements.findFirst({
          where: and(
            eq(entitlements.userId, user.id),
            eq(entitlements.kind, "lifetime"),
            isNull(entitlements.revokedAt),
          ),
        });
        if (
          (lifetime || user.state === "deleting") &&
          !sub.cancel_at_period_end &&
          !revoked
        )
          await enqueue(
            tx,
            "cancel_subscription",
            "cancel:" + sub.id + ":" + modified.toISOString(),
            { subscriptionId: sub.id },
          );
      }),
    );
  }
  await withDb((db) =>
    db
      .update(webhookEvents)
      .set({ processedAt: new Date() })
      .where(eq(webhookEvents.id, eventId)),
  );
}
async function cancelSubscription(id: string, key: string) {
  const result = providerSubscription.parse(
    await polarApi(
      "/subscriptions/" + encodeURIComponent(id),
      "PATCH",
      { cancel_at_period_end: true },
      key,
    ),
  );
  if (
    !result.cancel_at_period_end &&
    !["canceled", "unpaid", "incomplete_expired"].includes(result.status)
  )
    throw new Error("Polar has not confirmed renewal cancellation.");
}
async function deleteAccount(userId: string) {
  const user = await withDb((db) =>
    db.query.users.findFirst({ where: eq(users.id, userId) }),
  );
  if (!user || user.state !== "deleting") return;
  // Stop renewals first, including subscriptions whose local webhooks are delayed.
  for (let page = 1; ; page++) {
    const list = z
      .object({ items: z.array(providerSubscription) })
      .parse(
        await polarApi(
          "/subscriptions/?external_customer_id=" +
            encodeURIComponent(user.id) +
            "&limit=100&page=" +
            page,
        ),
      );
    for (const sub of list.items)
      if (
        !sub.cancel_at_period_end &&
        !["canceled", "unpaid"].includes(sub.status)
      )
        await cancelSubscription(sub.id, "delete:" + user.id + ":" + sub.id);
    if (list.items.length < 100) break;
  }
  const pending = await withDb((db) =>
    db.query.checkoutIntents.findFirst({
      where: and(
        eq(checkoutIntents.userId, user.id),
        isNull(checkoutIntents.url),
        sql`${checkoutIntents.expiresAt} > now()`,
      ),
    }),
  );
  if (pending) throw new DeferredJob(new Date(Date.now() + 60000));
  const checkouts = z
    .object({
      items: z.array(
        z.object({ status: z.string(), expires_at: z.coerce.date() }),
      ),
    })
    .parse(
      await polarApi(
        "/checkouts/?external_customer_id=" +
          encodeURIComponent(user.id) +
          "&status=open&status=confirmed&limit=100",
      ),
    );
  if (
    checkouts.items.some(
      (c) =>
        ["open", "confirmed"].includes(c.status) && c.expires_at > new Date(),
    )
  )
    throw new DeferredJob(new Date(Date.now() + 60000));
  const authResponse = await fetch(
    "https://console.neon.tech/api/v2/projects/" +
      encodeURIComponent(required("NEON_PROJECT_ID")) +
      "/branches/" +
      encodeURIComponent(required("NEON_BRANCH_ID")) +
      "/auth/users/" +
      encodeURIComponent(user.authId),
    {
      method: "DELETE",
      headers: { Authorization: "Bearer " + required("NEON_API_KEY") },
      signal: providerSignal(),
    },
  );
  if (!authResponse.ok)
    throw new Error("Neon account deletion failed: " + authResponse.status);
  await withDb((db) =>
    db.transaction(async (tx) => {
      await tx.delete(progress).where(eq(progress.userId, user.id));
      await tx
        .delete(playbackSessions)
        .where(eq(playbackSessions.userId, user.id));
      await tx
        .update(entitlements)
        .set({ revokedAt: new Date() })
        .where(eq(entitlements.userId, user.id));
      await tx
        .update(refundRequests)
        .set({ reason: "[Account deleted]", response: "" })
        .where(eq(refundRequests.userId, user.id));
      await tx
        .update(users)
        .set({
          state: "deleted",
          name: "Deleted student",
          email: "deleted+" + user.id + "@invalid.local",
        })
        .where(eq(users.id, user.id));
    }),
  );
}
export async function runJobs(limit = 10) {
  let count = 0;
  const deadline = Date.now() + 45000;
  while (count < limit && Date.now() < deadline) {
    const lease = crypto.randomUUID();
    const job = await withDb((db) =>
      db.transaction(async (tx) => {
        const [candidate] = await tx
          .select()
          .from(jobs)
          .where(
            and(
              isNull(jobs.doneAt),
              isNull(jobs.failedAt),
              lte(jobs.runAt, new Date()),
              or(isNull(jobs.lockedUntil), lte(jobs.lockedUntil, new Date())),
            ),
          )
          .limit(1)
          .for("update", { skipLocked: true });
        if (!candidate) return null;
        return (
          await tx
            .update(jobs)
            .set({
              lease,
              lockedUntil: new Date(Date.now() + 120000),
              attempts: candidate.attempts + 1,
            })
            .where(eq(jobs.id, candidate.id))
            .returning()
        )[0];
      }),
    );
    if (!job) break;
    try {
      await withJobBudget(deadline, async () => {
        if (job.type === "webhook") await handleEvent(job.payload.eventId);
        if (job.type === "cancel_subscription")
          await cancelSubscription(job.payload.subscriptionId, job.key);
        if (job.type === "delete_account")
          await deleteAccount(job.payload.userId);
      });
      await withDb((db) =>
        db
          .update(jobs)
          .set({ doneAt: new Date(), lockedUntil: null })
          .where(and(eq(jobs.id, job.id), eq(jobs.lease, lease))),
      );
    } catch (error) {
      if (error instanceof DeferredJob || error instanceof JobBudgetExceeded) {
        await withDb((db) =>
          db
            .update(jobs)
            .set({
              lockedUntil: null,
              attempts: job.attempts - 1,
              runAt:
                error instanceof DeferredJob
                  ? error.nextRun
                  : new Date(Date.now() + 60000),
              lastError: error.message,
            })
            .where(and(eq(jobs.id, job.id), eq(jobs.lease, lease))),
        );
        count++;
        continue;
      }
      Sentry.captureException(error, {
        tags: {
          jobType: job.type,
          jobId: job.id,
          terminal: job.attempts >= 10 ? "true" : "false",
        },
      });
      await withDb((db) =>
        db
          .update(jobs)
          .set({
            lastError: error instanceof Error ? error.message : "Job failed",
            lockedUntil: null,
            failedAt: job.attempts >= 10 ? new Date() : null,
            runAt: new Date(
              Date.now() + Math.min(3600, 2 ** job.attempts * 15) * 1000,
            ),
          })
          .where(and(eq(jobs.id, job.id), eq(jobs.lease, lease))),
      );
    }
    count++;
  }
  return { processed: count };
}
