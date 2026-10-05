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
      <h2 className="text-2xl font-medium mb-6">Students & ownership</h2>
      <div className="overflow-auto border rounded-xl">
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
        <a href={"?page=" + Math.max(1, page - 1)}>Previous</a>
        <span>Page {page}</span>
        {data.length === 50 && <a href={"?page=" + (page + 1)}>Next</a>}
      </div>
    </section>
  );
}
