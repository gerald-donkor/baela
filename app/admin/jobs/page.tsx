import { StudioHeading } from "@/components/admin/studio-ui";
import styles from "@/components/admin/studio.module.css";
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
      <StudioHeading
        title="Background jobs"
        description="Check pending tasks and retry failed jobs after fixing their service or product configuration."
      />
      <div className="space-y-4">
        {items.map((job) => (
          <article key={job.id} className={styles.panel}>
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
          <p className={`${styles.panel} text-muted-foreground text-sm`}>
            All caught up.
          </p>
        )}
      </div>
    </section>
  );
}
