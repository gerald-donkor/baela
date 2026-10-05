import { eq, and } from "drizzle-orm";
import { endpoint, sameOrigin } from "@/lib/http";
import { requireUser } from "@/lib/auth/server";
import { withDb } from "@/lib/db";
import { orders, checkoutIntents, entitlements } from "@/lib/db/schema";
import { executeAccountCommand } from "@/lib/server/account";
export const maxDuration = 60;
export async function GET(request: Request) {
  return endpoint(async () => {
    const user = await requireUser(true);
    const checkoutId = new URL(request.url).searchParams.get("checkout_id");
    return withDb(async (db) => {
      const intent = checkoutId
        ? await db.query.checkoutIntents.findFirst({
            where: and(
              eq(checkoutIntents.userId, user.id),
              eq(checkoutIntents.checkoutId, checkoutId),
            ),
          })
        : null;
      if (!intent) return { ready: false };
      const [row] = await db
        .select({ grant: entitlements })
        .from(entitlements)
        .innerJoin(orders, eq(orders.id, entitlements.sourceOrderId))
        .where(
          and(
            eq(entitlements.userId, user.id),
            eq(orders.checkoutId, checkoutId!),
          ),
        )
        .limit(1);
      const grant = row?.grant;
      return {
        ready:
          !!grant &&
          !grant.revokedAt &&
          grant.startsAt <= new Date() &&
          (!grant.endsAt || grant.endsAt > new Date()),
      };
    });
  });
}
export async function POST(request: Request) {
  return endpoint(async () => {
    sameOrigin(request);
    return executeAccountCommand(await request.json());
  });
}
