import { StudioHeading } from "@/components/admin/studio-ui";
import styles from "@/components/admin/studio.module.css";
import { requireAdminPage } from "@/lib/auth/server";
import { withDb } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CommandForm } from "@/components/admin/command-form";
import { RequiredField } from "@/components/admin/required-field";
export default async function Settings() {
  await requireAdminPage();
  const business = await withDb((db) =>
    db.query.settings.findFirst({ where: eq(settings.key, "business") }),
  );
  const value = business?.value || {};
  const policies = await withDb((db) => db.select().from(settings));
  return (
    <div className="space-y-7">
      <StudioHeading
        title="Studio settings"
        description="Manage your public profile, media setup, access plans, and policies."
      />
      <section className={styles.panel}>
        <h2>ImageKit uploads</h2>
        <p className={styles.panelDescription}>
          Configure these values in your local environment and deployment
          settings, then restart the application. Keep the private key on the
          server.
        </p>
        <dl className="mt-5 space-y-3 text-xs">
          {[
            { label: "Private key", name: "IMAGEKIT_PRIVATE_KEY" },
            { label: "Public key", name: "IMAGEKIT_PUBLIC_KEY" },
            {
              label: "URL endpoint",
              name: "IMAGEKIT_URL_ENDPOINT",
            },
          ].map(({ label, name }) => {
            const configured = !!(
              process.env[name] ||
              (name !== "IMAGEKIT_PRIVATE_KEY" &&
                process.env["NEXT_PUBLIC_" + name])
            );
            return (
              <div
                key={name}
                className="flex flex-wrap items-center justify-between gap-2 border-b pb-3"
              >
                <div>
                  <dt className="font-medium">{label}</dt>
                  <dd className="text-muted-foreground mt-1 break-all">
                    {name}
                  </dd>
                </div>
                <span
                  className={
                    configured ? "text-success" : "text-muted-foreground"
                  }
                >
                  {configured ? "Configured" : "Missing"}
                </span>
              </div>
            );
          })}
        </dl>
        <a
          href="https://imagekit.io/dashboard/developer"
          target="_blank"
          rel="noreferrer"
          className={styles.textLink}
        >
          Open ImageKit developer settings
        </a>
      </section>
      <section className={styles.panel}>
        <h2 className="text-xl font-medium mb-5">Business profile</h2>
        <CommandForm base={{ action: "business" }}>
          <label className="field-label">
            <RequiredField>Seller name</RequiredField>
            <input
              name="name"
              defaultValue={value.name}
              className="field"
              required
            />
          </label>
          <label className="field-label">
            <RequiredField>Public instructor name</RequiredField>
            <input
              name="instructor"
              defaultValue={value.instructor}
              className="field"
              required
            />
          </label>
          <label className="field-label">
            <RequiredField>Country (two-letter code)</RequiredField>
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
            <RequiredField>Seller type</RequiredField>
            <select
              name="sellerType"
              className="field"
              defaultValue={value.sellerType || "individual"}
              required
            >
              <option value="individual">Individual</option>
              <option value="business">Registered business</option>
            </select>
          </label>
          <label className="field-label">
            <RequiredField>Support email</RequiredField>
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
        <section className={styles.panel} key={kind}>
          <h2 className="text-xl font-medium mb-4 capitalize">
            {kind} product
          </h2>
          <CommandForm
            base={{ action: "offer", kind, courseId: null }}
            label="Connect / refresh product"
          >
            <label className="field-label">
              <RequiredField>Polar product ID</RequiredField>
              <input name="productId" className="field" required />
            </label>
          </CommandForm>
        </section>
      ))}
      {(["privacy", "terms", "refund-policy"] as const).map((key) => (
        <section className={styles.panel} key={key}>
          <h2 className="text-xl font-medium mb-4 capitalize">
            {key.replaceAll("-", " ")}
          </h2>
          <CommandForm base={{ action: "policy", key }} label="Publish policy">
            <label className="field-label">
              <RequiredField>Policy text (Markdown)</RequiredField>
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
