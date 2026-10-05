import { withDb } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Markdown } from "@/components/markdown";
const titles: Record<string, string> = {
  privacy: "Privacy policy",
  terms: "Terms of use",
  "refund-policy": "Refund policy",
};
export async function LegalPage({
  legal,
}: {
  legal: "privacy" | "terms" | "refund-policy";
}) {
  const policy = process.env.DATABASE_URL
    ? await withDb((db) =>
        db.query.settings.findFirst({
          where: eq(settings.key, "policy:" + legal),
        }),
      )
    : null;
  return (
    <div className="shell max-w-3xl py-16">
      <h1 className="text-4xl font-medium mb-8">{titles[legal]}</h1>
      {policy?.value.content ? (
        <Markdown content={policy.value.content} />
      ) : (
        <p className="text-muted-foreground">
          This policy will be published before enrollment opens.
        </p>
      )}
    </div>
  );
}
