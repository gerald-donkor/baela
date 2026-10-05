import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { endpoint, sameOrigin, HttpError } from "@/lib/http";
import { requireUser } from "@/lib/auth/server";
import { withDb } from "@/lib/db";
import { courses, offers, checkoutIntents, users } from "@/lib/db/schema";
import { grantsFor } from "@/lib/server/catalog";
import { hasAllAccess, evaluateAccess } from "@/lib/domain/access";
import { polarApi, providerProduct, offerPrice } from "@/lib/server/polar";
import { site } from "@/lib/config";
import { rateLimit } from "@/lib/server/rate-limit";
export async function POST(request: Request) {
  return endpoint(async () => {
    sameOrigin(request);
    if (
      process.env.POLAR_SERVER === "production" &&
      process.env.LEGAL_PAGES_APPROVED !== "true"
    )
      throw new HttpError(503, "Enrollment is not open yet.");
    const user = await requireUser();
    if (!user.verified)
      throw new HttpError(403, "Verify your email before purchasing.");
    await rateLimit("checkout:" + user.id, 10);
    const { offerId } = z
      .object({ offerId: z.uuid() })
      .parse(await request.json());
    const intent = await withDb((db) =>
      db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${user.id}))`,
        );
        const currentUser = await tx.query.users.findFirst({
          where: eq(users.id, user.id),
        });
        if (currentUser?.state !== "active")
          throw new HttpError(403, "Account unavailable.");
        const offer = await tx.query.offers.findFirst({
          where: and(eq(offers.id, offerId), eq(offers.active, true)),
        });
        if (!offer) throw new HttpError(404, "This offer is not available.");
        const grants = await grantsFor(tx, user.id);
        const lifetime = grants.some(
          (g) =>
            g.kind === "lifetime" && !g.revokedAt && g.startsAt <= new Date(),
        );
        if (
          lifetime ||
          (offer.kind === "monthly" && hasAllAccess(grants)) ||
          (offer.kind === "course" &&
            evaluateAccess(offer.courseId!, false, true, grants).allowed)
        )
          throw new HttpError(409, "You already have access to this offer.");
        if (offer.courseId) {
          const course = await tx.query.courses.findFirst({
            where: eq(courses.id, offer.courseId),
          });
          if (course?.status !== "published")
            throw new HttpError(409, "This course is not for sale.");
        }
        const product = providerProduct.parse(
          await polarApi("/products/" + offer.productId),
        );
        const price = offerPrice(product, offer.kind);
        if (!price)
          throw new HttpError(409, "This offer is currently unavailable.");
        if (price.price_amount !== offer.amount)
          throw new HttpError(
            409,
            "The price has changed. Refresh this page before purchasing.",
          );
        const prior = await tx.query.checkoutIntents.findFirst({
          where: and(
            eq(checkoutIntents.userId, user.id),
            eq(checkoutIntents.offerId, offer.id),
          ),
        });
        if (prior && prior.expiresAt > new Date())
          return { row: prior, create: false, productId: product.id };
        const intentId = crypto.randomUUID();
        const [row] = await tx
          .insert(checkoutIntents)
          .values({
            id: intentId,
            userId: user.id,
            offerId: offer.id,
            expiresAt: new Date(Date.now() + 86400000),
          })
          .onConflictDoUpdate({
            target: [checkoutIntents.userId, checkoutIntents.offerId],
            set: {
              id: intentId,
              checkoutId: null,
              url: null,
              expiresAt: new Date(Date.now() + 86400000),
            },
          })
          .returning();
        return { row, create: true, productId: product.id };
      }),
    );
    if (intent.row.url) return { url: intent.row.url };
    const checkoutSchema = z.object({
      id: z.string(),
      url: z.url(),
      expires_at: z.coerce.date(),
    });
    let checkout;
    if (intent.create) {
      // Reserve durably before calling Polar. Its checkout API does not promise idempotent POSTs.
      checkout = checkoutSchema.parse(
        await polarApi("/checkouts/", "POST", {
          products: [intent.productId],
          external_customer_id: user.id,
          customer_email: user.email,
          metadata: { baela_intent_id: intent.row.id },
          allow_discount_codes: false,
          allow_trial: false,
          success_url: site.url + "/checkout/success?checkout_id={CHECKOUT_ID}",
          return_url: site.url + "/dashboard",
        }),
      );
    } else {
      // Recover an ambiguous response instead of creating a second payable checkout.
      const list = z
        .object({
          items: z.array(
            checkoutSchema.extend({
              metadata: z.record(z.string(), z.unknown()),
            }),
          ),
        })
        .parse(
          await polarApi(
            "/checkouts/?external_customer_id=" +
              encodeURIComponent(user.id) +
              "&product_id=" +
              encodeURIComponent(intent.productId) +
              "&limit=100&sorting=-created_at",
          ),
        );
      checkout = list.items.find(
        (c) => c.metadata.baela_intent_id === intent.row.id,
      );
      if (!checkout)
        throw new HttpError(
          409,
          "Your checkout is still being prepared. Try again shortly; if it does not appear, contact support.",
        );
    }
    await withDb((db) =>
      db
        .update(checkoutIntents)
        .set({
          checkoutId: checkout.id,
          url: checkout.url,
          expiresAt: checkout.expires_at,
        })
        .where(eq(checkoutIntents.id, intent.row.id)),
    );
    return { url: checkout.url };
  });
}
