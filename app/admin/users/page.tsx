import { StudioHeading } from "@/components/admin/studio-ui";
import styles from "@/components/admin/studio.module.css";
import { requireAdminPage } from "@/lib/auth/server";
import { desc, eq, inArray } from "drizzle-orm";
import { withDb } from "@/lib/db";
import { users, entitlements, courses } from "@/lib/db/schema";
export default async function Students({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdminPage();
  const requestedPage = Number((await searchParams).page);
  const page = Number.isFinite(requestedPage)
    ? Math.min(1000000, Math.max(1, Math.floor(requestedPage) || 1))
    : 1;
  const data = await withDb(async (db) => {
    const students = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(50)
      .offset((page - 1) * 50);
    const grants = students.length
      ? await db
          .select({ grant: entitlements, courseTitle: courses.title })
          .from(entitlements)
          .leftJoin(courses, eq(courses.id, entitlements.courseId))
          .where(
            inArray(
              entitlements.userId,
              students.map((u) => u.id),
            ),
          )
      : [];
    return students.map((u) => ({
      ...u,
      grants: grants
        .filter((g) => g.grant.userId === u.id)
        .map(({ grant, courseTitle }) => ({ ...grant, courseTitle })),
    }));
  });
  return (
    <section>
      <StudioHeading
        title="Students"
        description="See who’s learning with you, and the courses they can access."
      />
      <div className={styles.tableWrap}>
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary">
            <tr>
              <th className="p-4">Student</th>
              <th>Email</th>
              <th>Account</th>
              <th>Access sources</th>
            </tr>
          </thead>
          <tbody>
            {!data.length && (
              <tr>
                <td colSpan={4} className="text-center text-muted-foreground">
                  No students on this page. New students will appear here when
                  they sign in.
                </td>
              </tr>
            )}
            {data.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-4">{u.name}</td>
                <td>{u.email}</td>
                <td>{u.state}</td>
                <td className="p-4">
                  {u.grants
                    .map(
                      (g) =>
                        (g.kind === "course"
                          ? g.courseTitle || "Course purchase"
                          : g.kind === "monthly"
                            ? "Monthly all-access"
                            : "Lifetime all-access") +
                        (g.revokedAt
                          ? " (refunded/revoked)"
                          : g.startsAt > new Date()
                            ? " (upcoming)"
                            : g.endsAt && g.endsAt <= new Date()
                              ? " (expired)"
                              : ""),
                    )
                    .join(", ") || "No purchases"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-6 mt-5">
        {page > 1 && (
          <a href={"?page=" + (page - 1)} className="text-primary">
            Previous
          </a>
        )}
        <span>Page {page}</span>
        {data.length === 50 && <a href={"?page=" + (page + 1)}>Next</a>}
      </div>
    </section>
  );
}
