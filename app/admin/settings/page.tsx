import { requireAdminPage } from "@/lib/auth/server";
import { withDb } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CommandForm } from "@/components/admin/command-form";
export default async function Settings() {
  await requireAdminPage();
  const business = await withDb((db) =>
    db.query.settings.findFirst({ where: eq(settings.key, "business") }),
  );
  const value = business?.value || {};
  const policies = await withDb((db) => db.select().from(settings));
  return (
    <div className="max-w-2xl space-y-8">
      <section className="border rounded-2xl p-6">
        <h2 className="text-xl font-medium mb-5">Business profile</h2>
        <CommandForm base={{ action: "business" }}>
          <label className="field-label">
            Seller name
            <input
              name="name"
              defaultValue={value.name}
              className="field"
              required
            />
          </label>
          <label className="field-label">
            Public instructor name
            <input
              name="instructor"
              defaultValue={value.instructor}
              className="field"
              required
            />
          </label>
          <label className="field-label">
            Country (two-letter code)
            <input
              name="country"
              defaultValue={value.country}
              className="field"
              minLength={2}
              maxLength={2}
              pattern="[A-Z]{2}"
              placeholder="GH"
              required
            />
          </label>
          <label className="field-label">
            Seller type
            <select
              name="sellerType"
              className="field"
              defaultValue={value.sellerType || "individual"}
            >
              <option value="individual">Individual</option>
              <option value="business">Registered business</option>
            </select>
          </label>
          <label className="field-label">
            Support email
            <input
              name="supportEmail"
              type="email"
              className="field"
              defaultValue={value.supportEmail}
              required
            />
          </label>
        </CommandForm>
        <p className="text-xs text-muted-foreground mt-4">
          These details do not replace Polar’s seller onboarding and approval.
        </p>
      </section>
      {(["monthly", "lifetime"] as const).map((kind) => (
        <section className="border rounded-2xl p-6" key={kind}>
          <h2 className="text-xl font-medium mb-4 capitalize">
            {kind} product
          </h2>
          <CommandForm
            base={{ action: "offer", kind, courseId: null }}
            label="Connect / refresh product"
          >
            <label className="field-label">
              Polar product ID
              <input name="productId" className="field" required />
            </label>
          </CommandForm>
        </section>
      ))}
      {(["privacy", "terms", "refund-policy"] as const).map((key) => (
        <section className="border rounded-2xl p-6" key={key}>
          <h2 className="text-xl font-medium mb-4 capitalize">
            {key.replaceAll("-", " ")}
          </h2>
          <CommandForm base={{ action: "policy", key }} label="Publish policy">
            <label className="field-label">
              Policy text (Markdown)
              <textarea
                name="content"
                className="field min-h-64"
                required
                minLength={50}
                defaultValue={
                  policies.find((p) => p.key === "policy:" + key)?.value
                    .content || ""
                }
              />
            </label>
          </CommandForm>
        </section>
      ))}
    </div>
  );
}
