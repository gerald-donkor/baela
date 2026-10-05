import { requireAdminPage } from "@/lib/auth/server";
import { notFound } from "next/navigation";
import { asc, eq, inArray } from "drizzle-orm";
import { withDb } from "@/lib/db";
import { courses, sections, lessons, revisions, assets } from "@/lib/db/schema";
import { CourseEditor } from "@/components/admin/course-editor";
export default async function EditCourse({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const data = await withDb(async (db) => {
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, id),
    });
    if (!course) return null;
    const groups = await db
      .select()
      .from(sections)
      .where(eq(sections.courseId, id))
      .orderBy(asc(sections.position));
    const items = groups.length
      ? await db
          .select()
          .from(lessons)
          .where(
            inArray(
              lessons.sectionId,
              groups.map((g) => g.id),
            ),
          )
          .orderBy(asc(lessons.position))
      : [];
    return {
      course,
      sections: groups,
      lessons: items,
      revisions: items.length
        ? await db
            .select()
            .from(revisions)
            .where(
              inArray(
                revisions.lessonId,
                items.map((i) => i.id),
              ),
            )
        : [],
      media: await db.select().from(assets),
    };
  });
  if (!data) notFound();
  return <CourseEditor {...data} />;
}
