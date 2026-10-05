import { desc, isNull } from "drizzle-orm";
import { requireAdminPage } from "@/lib/auth/server";
import { withDb } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { CommandForm } from "@/components/admin/command-form";
export default async function JobsPage() {
  await requireAdminPage();
  const items = await withDb((db) =>
    db
      .select()
      .from(jobs)
      .where(isNull(jobs.doneAt))
      .orderBy(desc(jobs.createdAt))
      .limit(100),
  );
  return (
    <section>
      <h2 className="text-2xl font-medium mb-3">Background jobs</h2>
      <p className="text-muted-foreground mb-6">
        Failed jobs require attention. Fix the underlying service or product
        configuration before retrying.
      </p>
      <div className="space-y-4">
        {items.map((job) => (
          <article key={job.id} className="border rounded-xl p-5">
            <h3 className="font-medium">
              {job.type.replaceAll("_", " ")} ·{" "}
              {job.failedAt ? "Failed" : "Pending"}
            </h3>
            <p className="text-xs text-muted-foreground mt-2">
              {job.id} · {job.attempts} attempts · Next attempt{" "}
              {job.runAt.toISOString()}
            </p>
            {job.lastError && <p className="text-sm my-4">{job.lastError}</p>}
            {job.failedAt && (
              <CommandForm
                base={{ action: "retry-job", id: job.id }}
                label="Retry job"
              />
            )}
          </article>
        ))}
        {!items.length && (
          <p className="border rounded-xl p-8 text-muted-foreground">
            All caught up.
          </p>
        )}
      </div>
    </section>
  );
}
