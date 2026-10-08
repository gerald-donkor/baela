import { StudioHeading } from "@/components/admin/studio-ui";
import styles from "@/components/admin/studio.module.css";
import { requireAdminPage } from "@/lib/auth/server";
import { desc, eq } from "drizzle-orm";
import { withDb } from "@/lib/db";
import { refundRequests, users } from "@/lib/db/schema";
import { CommandForm } from "@/components/admin/command-form";
import { RequiredField } from "@/components/admin/required-field";
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
      <StudioHeading
        title="Refund requests"
        description="Review requests here. Issue approved refunds in Polar; confirmed refunds update access automatically."
      />
      <div className="space-y-5">
        {rows.map(({ request: r, user }) => (
          <article key={r.id} className={styles.panel}>
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
                  <label className="field-label">
                    <RequiredField>Response to student</RequiredField>
                    <textarea
                      name="response"
                      className="field"
                      defaultValue={r.response}
                      required
                    />
                  </label>
                </CommandForm>
                <CommandForm
                  base={{ action: "refund-response", id: r.id, decline: true }}
                  label="Decline request"
                >
                  <label className="field-label">
                    <RequiredField>Reason for declining</RequiredField>
                    <textarea name="response" className="field" required />
                  </label>
                </CommandForm>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{r.response}</p>
            )}
          </article>
        ))}
        {!rows.length && (
          <p className={`${styles.panel} text-muted-foreground text-sm`}>
            No refund requests yet.
          </p>
        )}
      </div>
    </section>
  );
}
