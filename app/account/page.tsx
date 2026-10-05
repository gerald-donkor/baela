export const maxDuration = 60;
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getViewer } from "@/lib/auth/server";
import { withDb } from "@/lib/db";
import { orders, refundRequests } from "@/lib/db/schema";
import { AccountPanel } from "@/components/account-panel";
export const metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};
export default async function Account() {
  const user = await getViewer();
  if (!user) redirect("/auth/sign-in?next=/account");
  const data = await withDb(async (db) => ({
    orders: await db
      .select()
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt)),
    requests: await db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.userId, user.id))
      .orderBy(desc(refundRequests.createdAt)),
  }));
  return (
    <div className="shell max-w-3xl py-14">
      <p className="eyebrow">Your account</p>
      <h1 className="text-4xl font-medium mt-3">A space of your own.</h1>
      <p className="text-muted-foreground mt-3 mb-9">
        {user.name} · {user.email}
      </p>
      <AccountPanel
        state={user.state}
        admin={user.admin}
        orders={data.orders}
        requests={data.requests}
      />
    </div>
  );
}
