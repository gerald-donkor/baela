import "server-only";
import { count, desc, eq, isNull, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/server";
import { withDb } from "@/lib/db";
import { courses, lessons, sections, users } from "@/lib/db/schema";

export async function getStudioOverview() {
  const user = await requireAdmin();
  return withDb(async (db) => {
    const sectionCounts = db
      .select({
        courseId: sections.courseId,
        sectionCount: count().as("section_count"),
      })
      .from(sections)
      .groupBy(sections.courseId)
      .as("section_counts");
    const lessonCounts = db
      .select({
        courseId: sections.courseId,
        lessonCount: count().as("lesson_count"),
        publishedLessonCount:
          sql<number>`count(*) filter (where ${lessons.publishedRevisionId} is not null)`
            .mapWith(Number)
            .as("published_lesson_count"),
      })
      .from(lessons)
      .innerJoin(sections, eq(lessons.sectionId, sections.id))
      .where(isNull(lessons.retiredAt))
      .groupBy(sections.courseId)
      .as("lesson_counts");
    const items = await db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        summary: courses.summary,
        status: courses.status,
        coverId: courses.coverId,
        createdAt: courses.createdAt,
        sectionCount:
          sql<number>`coalesce(${sectionCounts.sectionCount}, 0)`.mapWith(
            Number,
          ),
        lessonCount:
          sql<number>`coalesce(${lessonCounts.lessonCount}, 0)`.mapWith(Number),
        publishedLessonCount:
          sql<number>`coalesce(${lessonCounts.publishedLessonCount}, 0)`.mapWith(
            Number,
          ),
      })
      .from(courses)
      .leftJoin(sectionCounts, eq(courses.id, sectionCounts.courseId))
      .leftJoin(lessonCounts, eq(courses.id, lessonCounts.courseId))
      .orderBy(desc(courses.createdAt));
    const [students] = await db
      .select({ value: count() })
      .from(users)
      .where(
        sql`${users.authId} <> ${user.authId} and ${users.state} = 'active'`,
      );
    return { items, studentCount: students.value };
  });
}
