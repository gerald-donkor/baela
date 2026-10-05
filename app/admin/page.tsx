import { requireAdminPage } from "@/lib/auth/server";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { withDb } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { CommandForm } from "@/components/admin/command-form";
export default async function Admin() {
  await requireAdminPage();
  const items = await withDb((db) =>
    db.select().from(courses).orderBy(desc(courses.createdAt)),
  );
  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-10">
      <section>
        <h2 className="text-2xl font-medium mb-6">Your courses</h2>
        <div className="space-y-3">
          {items.map((c) => (
            <Link
              key={c.id}
              href={"/admin/courses/" + c.id}
              className="border rounded-xl p-6 flex items-center justify-between bg-card"
            >
              <span className="font-medium">{c.title}</span>
              <span className="text-sm text-muted-foreground capitalize">
                {c.status} →
              </span>
            </Link>
          ))}
          {!items.length && (
            <p className="text-muted-foreground border border-dashed p-8 rounded-xl">
              Create your first course to get started.
            </p>
          )}
        </div>
      </section>
      <aside className="border rounded-2xl p-6 self-start">
        <h2 className="text-xl font-medium mb-5">Start a new course</h2>
        <CommandForm
          base={{ action: "course", summary: "", description: "" }}
          label="Create course"
          redirectTo="/admin/courses/{id}"
        >
          <label className="field-label">
            Title
            <input className="field" name="title" required />
          </label>
          <label className="field-label">
            URL slug
            <input
              className="field"
              name="slug"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="your-course-name"
              required
            />
          </label>
        </CommandForm>
      </aside>
    </div>
  );
}
