import { requireAdminPage } from "@/lib/auth/server";
import { desc, eq } from "drizzle-orm";
import { withDb } from "@/lib/db";
import { refundRequests, users } from "@/lib/db/schema";
import { CommandForm } from "@/components/admin/command-form";
export default async function Refunds() {
  await requireAdminPage();
  const rows = await withDb((db) =>
    db
      .select({ request: refundRequests, user: users })
      .from(refundRequests)
      .innerJoin(users, eq(users.id, refundRequests.userId))
      .orderBy(desc(refundRequests.createdAt))
      .limit(100),
  );
  return (
    <section>
      <h2 className="text-2xl font-medium mb-3">Refund requests</h2>
      <p className="text-muted-foreground mb-6">
        Review requests here. Issue approved refunds in Polar; confirmed refunds
        update access automatically.
      </p>
      <div className="space-y-5">
        {rows.map(({ request: r, user }) => (
          <article key={r.id} className="border rounded-xl p-6">
            <div className="flex justify-between">
              <h3 className="font-medium">
                {user.name} · {user.email}
              </h3>
              <span className="text-sm capitalize">{r.status}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Order: {r.orderId}
            </p>
            <p className="my-4">{r.reason}</p>
            {r.status === "pending" ? (
              <div className="grid md:grid-cols-2 gap-5">
                <CommandForm
                  base={{ action: "refund-response", id: r.id, decline: false }}
                  label="Save response"
                >
                  <textarea
                    aria-label="Response to student"
                    name="response"
                    className="field"
                    defaultValue={r.response}
                    required
                  />
                </CommandForm>
                <CommandForm
                  base={{ action: "refund-response", id: r.id, decline: true }}
                  label="Decline request"
                >
                  <textarea
                    aria-label="Reason for declining"
                    name="response"
                    className="field"
                    required
                  />
                </CommandForm>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{r.response}</p>
            )}
          </article>
        ))}
        {!rows.length && (
          <p className="p-8 border rounded-xl text-muted-foreground">
            No refund requests yet.
          </p>
        )}
      </div>
    </section>
  );
}
