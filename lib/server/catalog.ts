import "server-only";
import { and, asc, eq, inArray, isNull, desc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { withDb, type Db } from "@/lib/db";
import {
  courses,
  sections,
  lessons,
  revisions,
  offers,
  entitlements,
  assets,
  progress,
  settings,
} from "@/lib/db/schema";
import { evaluateAccess } from "@/lib/domain/access";
import { HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/server";
export const catalog = unstable_cache(
  async () => {
    if (!process.env.DATABASE_URL) return [];
    return withDb((db) =>
      db
        .select({ course: courses, offer: offers })
        .from(courses)
        .leftJoin(
          offers,
          and(eq(offers.courseId, courses.id), eq(offers.active, true)),
        )
        .where(eq(courses.status, "published"))
        .orderBy(desc(courses.createdAt)),
    );
  },
  ["catalog"],
  { tags: ["catalog"], revalidate: 300 },
);
export async function allAccessOffers() {
  if (!process.env.DATABASE_URL) return [];
  return withDb((db) =>
    db
      .select()
      .from(offers)
      .where(
        and(
          inArray(offers.kind, ["monthly", "lifetime"]),
          eq(offers.active, true),
        ),
      ),
  );
}
export async function grantsFor(db: Db, userId?: string) {
  return userId
    ? db.select().from(entitlements).where(eq(entitlements.userId, userId))
    : [];
}
export async function curriculum(db: Db, courseId: string) {
  return db
    .select({ lesson: lessons, section: sections, revision: revisions })
    .from(sections)
    .innerJoin(lessons, eq(lessons.sectionId, sections.id))
    .innerJoin(revisions, eq(lessons.publishedRevisionId, revisions.id))
    .where(and(eq(sections.courseId, courseId), isNull(lessons.retiredAt)))
    .orderBy(asc(sections.position), asc(lessons.position));
}
export async function courseDetail(slug: string) {
  if (!process.env.DATABASE_URL) return null;
  return withDb(async (db) => {
    const course = await db.query.courses.findFirst({
      where: eq(courses.slug, slug),
    });
    if (!course || course.status === "draft") return null;
    const rows = await curriculum(db, course.id);
    const offer = await db.query.offers.findFirst({
      where: and(eq(offers.courseId, course.id), eq(offers.active, true)),
    });
    // Never send lesson bodies or attachment identities to a sales page.
    return {
      course,
      offer,
      trailer: course.trailerId ? { courseId: course.id } : null,
      curriculum: rows.map((r) => ({
        id: r.lesson.id,
        title: r.revision.title,
        section: r.section.title,
        preview: r.revision.preview,
      })),
    };
  });
}
export async function authorizedTrailer(
  db: Db,
  courseId: string,
  draft = false,
) {
  if (draft) await requireAdmin();
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
  });
  if (!course || (!draft && course.status === "draft"))
    throw new HttpError(404, "Trailer not found.");
  const assetId = draft ? course.trailerDraftId : course.trailerId;
  if (!assetId) throw new HttpError(404, "Trailer not found.");
  const asset = await assetById(db, assetId);
  if (
    !asset ||
    asset.kind !== "video" ||
    !asset.private ||
    !asset.ready ||
    asset.duration <= 0
  )
    throw new HttpError(409, "This trailer is still processing.");
  return asset;
}
export async function authorizedLesson(
  db: Db,
  lessonId: string,
  userId?: string,
  admin = false,
) {
  const [row] = await db
    .select({
      lesson: lessons,
      section: sections,
      course: courses,
      revision: revisions,
    })
    .from(lessons)
    .innerJoin(sections, eq(lessons.sectionId, sections.id))
    .innerJoin(courses, eq(sections.courseId, courses.id))
    .innerJoin(revisions, eq(lessons.publishedRevisionId, revisions.id))
    .where(and(eq(lessons.id, lessonId), isNull(lessons.retiredAt)))
    .limit(1);
  if (!row) throw new HttpError(404, "Lesson not found.");
  const grants = await grantsFor(db, userId);
  const access = evaluateAccess(
    row.course.id,
    row.revision.preview,
    row.course.status !== "draft",
    grants,
  );
  if (!access.allowed && !admin)
    throw new HttpError(403, "This lesson requires course access.");
  return {
    ...row,
    access: admin ? { ...access, allowed: true, expiresAt: null } : access,
  };
}
export async function dashboard(userId: string) {
  return withDb(async (db) => {
    const grants = await grantsFor(db, userId);
    const rows = await db
      .select({
        course: courses,
        lesson: lessons,
        revision: revisions,
        progress,
      })
      .from(courses)
      .innerJoin(sections, eq(sections.courseId, courses.id))
      .innerJoin(
        lessons,
        and(eq(lessons.sectionId, sections.id), isNull(lessons.retiredAt)),
      )
      .innerJoin(revisions, eq(lessons.publishedRevisionId, revisions.id))
      .leftJoin(
        progress,
        and(eq(progress.lessonId, lessons.id), eq(progress.userId, userId)),
      )
      .where(inArray(courses.status, ["published", "archived"]))
      .orderBy(asc(sections.position), asc(lessons.position));
    return { rows, grants };
  });
}
export async function assetById(db: Db, id: string) {
  return (await db.select().from(assets).where(eq(assets.id, id)).limit(1))[0];
}

export const businessProfile = unstable_cache(
  async () => {
    if (!process.env.DATABASE_URL) return null;
    const row = await withDb((db) =>
      db.query.settings.findFirst({ where: eq(settings.key, "business") }),
    );
    return row?.value || null;
  },
  ["business-profile"],
  { tags: ["catalog"], revalidate: 300 },
);
