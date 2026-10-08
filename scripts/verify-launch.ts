import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
loadEnvConfig(process.cwd());
const failures: string[] = [];
const required = [
  "NEXT_PUBLIC_APP_URL",
  "DATABASE_URL",
  "NEON_AUTH_BASE_URL",
  "NEON_AUTH_COOKIE_SECRET",
  "ADMIN_AUTH_USER_ID",
  "NEON_API_KEY",
  "NEON_PROJECT_ID",
  "NEON_BRANCH_ID",
  "POLAR_ACCESS_TOKEN",
  "POLAR_WEBHOOK_SECRET",
  "IMAGEKIT_PRIVATE_KEY",
  "IMAGEKIT_PUBLIC_KEY",
  "IMAGEKIT_URL_ENDPOINT",
  "CRON_SECRET",
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_SUPPORT_EMAIL",
];
for (const key of required)
  if (
    !process.env[key] &&
    !(
      key.startsWith("IMAGEKIT_") &&
      key !== "IMAGEKIT_PRIVATE_KEY" &&
      process.env["NEXT_PUBLIC_" + key]
    )
  )
    failures.push("Missing " + key);
for (const key of ["NEON_AUTH_COOKIE_SECRET", "CRON_SECRET"])
  if ((process.env[key]?.length || 0) < 32)
    failures.push(key + " must have at least 32 random characters");
if (!process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://"))
  failures.push("Production APP_URL must use HTTPS");
if (process.env.POLAR_SERVER !== "production")
  failures.push("POLAR_SERVER must be production for a public launch");
if (process.env.LEGAL_PAGES_APPROVED !== "true")
  failures.push(
    "Publish reviewed legal policies, then set LEGAL_PAGES_APPROVED=true",
  );
async function main() {
  if (process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      const settings = await sql`select key,value from settings`;
      for (const key of ["privacy", "terms", "refund-policy"])
        if (
          !settings.some(
            (r) => r.key === "policy:" + key && r.value?.content?.length >= 50,
          )
        )
          failures.push("Missing published policy: " + key);
      const business = settings.find((r) => r.key === "business")?.value;
      if (
        !business?.country ||
        !business?.sellerType ||
        !business?.supportEmail
      )
        failures.push("Complete the business profile in Studio");
      const offers = await sql`select kind from offers where active=true`;
      for (const kind of ["course", "monthly", "lifetime"])
        if (!offers.some((r) => r.kind === kind))
          failures.push("Connect an active Polar " + kind + " product");
      const courses =
        await sql`select id from courses where status='published' limit 1`;
      if (!courses.length) failures.push("Publish at least one course");
      const jobs =
        await sql`select count(*)::int as count from jobs where failed_at is not null and done_at is null`;
      if (jobs[0]?.count)
        failures.push("Resolve failed background jobs in Studio");
    } catch {
      failures.push(
        "Could not read the database; check credentials and run migrations",
      );
    }
  }
  if (failures.length) {
    console.error(
      "Launch checks failed:\n" + failures.map((f) => "- " + f).join("\n"),
    );
    process.exitCode = 1;
  } else
    console.log(
      "Configuration checks passed. Complete the live-service acceptance checklist in docs/launch.md before opening enrollment.",
    );
}
void main();
