import "server-only";
import { z } from "zod";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/server";
import { withDb } from "@/lib/db";
import {
  courses,
  sections,
  lessons,
  revisions,
  assets,
  offers,
  refundRequests,
  settings,
  orders,
  jobs,
} from "@/lib/db/schema";
import { polarApi, providerProduct, offerPrice } from "@/lib/server/polar";
import { validateMarkdown } from "@/lib/domain/markdown";
const title = z.string().trim().min(1).max(180),
  id = z.uuid();
const commands = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("course"),
    id: id.optional(),
    title,
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(100),
    summary: z.string().max(300),
    description: z.string().max(20000),
    coverId: id.nullable().optional(),
  }),
  z.object({
    action: z.literal("course-status"),
    id,
    status: z.enum(["published", "archived"]),
  }),
  z.object({ action: z.literal("delete-course"), id }),
  z.object({ action: z.literal("course-cover"), id, coverId: id.nullable() }),
  z.object({
    action: z.literal("course-trailer"),
    id,
    trailerId: id.nullable(),
  }),
  z.object({ action: z.literal("publish-course-trailer"), id, trailerId: id }),
  z.object({ action: z.literal("remove-course-trailer"), id, trailerId: id }),
  z.object({ action: z.literal("retry-job"), id }),
  z.object({
    action: z.literal("section"),
    id: id.optional(),
    courseId: id,
    title,
  }),
  z.object({ action: z.literal("delete-section"), id }),
  z.object({
    action: z.literal("lesson"),
    id: id.optional(),
    sectionId: id,
    title,
    markdown: z.string().max(150000),
    videoId: id.nullable(),
    preview: z.boolean(),
    attachmentIds: z.array(id).max(30),
  }),
  z.object({ action: z.literal("publish-lesson"), id }),
  z.object({ action: z.literal("retire-lesson"), id }),
  z.object({
    action: z.literal("reorder"),
    kind: z.enum(["sections", "lessons"]),
    parentId: id,
    ids: z.array(id).min(1).max(500),
  }),
  z.object({
    action: z.literal("offer"),
    kind: z.enum(["course", "monthly", "lifetime"]),
    courseId: id.nullable(),
    productId: z.string().min(1),
  }),
  z.object({
    action: z.literal("refund-response"),
    id,
    response: z.string().trim().min(1).max(2000),
    decline: z.boolean(),
  }),
  z.object({
    action: z.literal("policy"),
    key: z.enum(["privacy", "terms", "refund-policy"]),
    content: z.string().trim().min(50).max(50000),
  }),
  z.object({
    action: z.literal("business"),
    name: title,
    country: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/),
    sellerType: z.enum(["individual", "business"]),
    instructor: title,
    supportEmail: z.email(),
  }),
]);
export async function executeAdminCommand(input: unknown) {
  await requireAdmin();
  const data = commands.parse(input);
  const result = await withDb((db) =>
    db.transaction(async (tx) => {
      // Serialize the sole instructor's concurrent tabs to keep positions/revisions consistent.
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext('baela-authoring'))`,
      );
      if (
        data.action === "course-trailer" ||
        data.action === "publish-course-trailer" ||
        data.action === "remove-course-trailer"
      ) {
        const course = await tx.query.courses.findFirst({
          where: eq(courses.id, data.id),
        });
        if (!course) throw new HttpError(404, "Course not found.");
        if (data.action === "remove-course-trailer") {
          if (course.trailerId !== data.trailerId)
            throw new HttpError(
              409,
              "The trailer changed. Refresh and try again.",
            );
          await tx
            .update(courses)
            .set({ trailerId: null })
            .where(eq(courses.id, data.id));
          return { saved: true };
        }
        if (data.trailerId) {
          const video = await tx.query.assets.findFirst({
            where: eq(assets.id, data.trailerId),
          });
          if (!video || video.kind !== "video" || !video.private)
            throw new HttpError(400, "Choose a private trailer video.");
          if (data.action === "publish-course-trailer") {
            if (course.trailerDraftId !== data.trailerId)
              throw new HttpError(
                409,
                "The trailer draft changed. Refresh and try again.",
              );
            if (!video.ready || video.duration <= 0)
              throw new HttpError(
                400,
                "Verify trailer processing before publishing.",
              );
          }
        }
        await tx
          .update(courses)
          .set(
            data.action === "course-trailer"
              ? { trailerDraftId: data.trailerId }
              : { trailerId: data.trailerId },
          )
          .where(eq(courses.id, data.id));
        return { saved: true };
      }
      if (data.action === "retry-job") {
        await tx
          .update(jobs)
          .set({
            failedAt: null,
            attempts: 0,
            runAt: new Date(),
            lockedUntil: null,
          })
          .where(
            and(
              eq(jobs.id, data.id),
              sql`${jobs.failedAt} is not null`,
              sql`${jobs.doneAt} is null`,
            ),
          );
        return { saved: true };
      }
      if (data.action === "course" || data.action === "course-cover") {
        if (data.coverId) {
          const cover = await tx.query.assets.findFirst({
            where: eq(assets.id, data.coverId),
          });
          if (!cover || cover.kind !== "image" || !cover.ready)
            throw new HttpError(400, "Choose a verified course image.");
        }
        if (data.action === "course-cover") {
          const [course] = await tx
            .update(courses)
            .set({ coverId: data.coverId })
            .where(eq(courses.id, data.id))
            .returning();
          if (!course) throw new HttpError(404, "Course not found.");
          return { saved: true };
        }
        const values = {
          title: data.title,
          slug: data.slug,
          summary: data.summary,
          description: data.description,
          coverId: data.coverId,
        };
        return data.id
          ? (
              await tx
                .update(courses)
                .set(values)
                .where(eq(courses.id, data.id))
                .returning()
            )[0]
          : (await tx.insert(courses).values(values).returning())[0];
      }
      if (data.action === "course-status") {
        if (data.status === "published") {
          const available = await tx
            .select({ id: lessons.id })
            .from(lessons)
            .innerJoin(sections, eq(lessons.sectionId, sections.id))
            .where(
              and(
                eq(sections.courseId, data.id),
                sql`${lessons.publishedRevisionId} is not null`,
                isNull(lessons.retiredAt),
              ),
            );
          if (!available.length)
            throw new HttpError(400, "Publish at least one lesson first.");
          const offer = await tx.query.offers.findFirst({
            where: and(eq(offers.courseId, data.id), eq(offers.active, true)),
          });
          if (!offer)
            throw new HttpError(
              400,
              "Connect an active Polar course product before publishing.",
            );
        }
        await tx
          .update(courses)
          .set({ status: data.status, everPublished: true })
          .where(eq(courses.id, data.id));
        return { saved: true };
      }
      if (data.action === "delete-course") {
        const course = await tx.query.courses.findFirst({
          where: eq(courses.id, data.id),
        });
        if (!course || course.everPublished || course.status !== "draft")
          throw new HttpError(
            409,
            "Previously published courses must be archived.",
          );
        const courseOffers = await tx
          .select()
          .from(offers)
          .where(eq(offers.courseId, data.id));
        if (courseOffers.length) {
          const bought = await tx
            .select()
            .from(orders)
            .where(
              inArray(
                orders.offerId,
                courseOffers.map((o) => o.id),
              ),
            );
          if (bought.length)
            throw new HttpError(409, "Purchased courses cannot be deleted.");
          await tx.delete(offers).where(eq(offers.courseId, data.id));
        }
        await tx.delete(courses).where(eq(courses.id, data.id));
        return { saved: true };
      }
      if (data.action === "section") {
        if (data.id)
          return (
            await tx
              .update(sections)
              .set({ title: data.title })
              .where(
                and(
                  eq(sections.id, data.id),
                  eq(sections.courseId, data.courseId),
                ),
              )
              .returning()
          )[0];
        const rows = await tx
          .select()
          .from(sections)
          .where(eq(sections.courseId, data.courseId));
        return (
          await tx
            .insert(sections)
            .values({
              courseId: data.courseId,
              title: data.title,
              position: rows.length,
            })
            .returning()
        )[0];
      }
      if (data.action === "delete-section") {
        const contents = await tx
          .select()
          .from(lessons)
          .where(eq(lessons.sectionId, data.id));
        if (contents.some((l) => l.publishedRevisionId))
          throw new HttpError(
            409,
            "A section containing published lessons cannot be deleted.",
          );
        await tx.delete(sections).where(eq(sections.id, data.id));
        return { saved: true };
      }
      if (data.action === "lesson") {
        let imageIds: string[];
        try {
          imageIds = validateMarkdown(data.markdown);
        } catch (error) {
          throw new HttpError(400, (error as Error).message);
        }
        if (imageIds.length) {
          const images = await tx
            .select()
            .from(assets)
            .where(inArray(assets.id, imageIds));
          if (
            images.length !== imageIds.length ||
            images.some(
              (asset) =>
                asset.kind !== "image" || !asset.ready || !asset.private,
            )
          )
            throw new HttpError(
              400,
              "All lesson images must be verified private uploads.",
            );
        }
        let lessonId = data.id;
        if (!lessonId) {
          const siblings = await tx
            .select()
            .from(lessons)
            .where(eq(lessons.sectionId, data.sectionId));
          const [lesson] = await tx
            .insert(lessons)
            .values({
              sectionId: data.sectionId,
              title: data.title,
              position: siblings.length,
            })
            .returning();
          lessonId = lesson.id;
        } else {
          const lesson = await tx.query.lessons.findFirst({
            where: and(
              eq(lessons.id, lessonId),
              eq(lessons.sectionId, data.sectionId),
            ),
          });
          if (!lesson) throw new HttpError(404, "Lesson not found.");
        }
        const [revision] = await tx
          .insert(revisions)
          .values({
            lessonId,
            title: data.title,
            markdown: data.markdown,
            videoId: data.videoId,
            preview: data.preview,
            attachmentIds: data.attachmentIds,
            imageIds,
          })
          .returning();
        await tx
          .update(lessons)
          .set({ draftRevisionId: revision.id, title: data.title })
          .where(eq(lessons.id, lessonId));
        return { id: lessonId };
      }
      if (data.action === "publish-lesson") {
        const lesson = await tx.query.lessons.findFirst({
          where: eq(lessons.id, data.id),
        });
        const revision = lesson?.draftRevisionId
          ? await tx.query.revisions.findFirst({
              where: eq(revisions.id, lesson.draftRevisionId),
            })
          : null;
        if (!revision?.videoId)
          throw new HttpError(400, "Save a draft with a video first.");
        const media = await tx
          .select()
          .from(assets)
          .where(
            inArray(assets.id, [
              revision.videoId,
              ...revision.attachmentIds,
              ...revision.imageIds,
            ]),
          );
        if (
          media.length !==
            new Set([
              revision.videoId,
              ...revision.attachmentIds,
              ...revision.imageIds,
            ]).size ||
          media.some(
            (a) =>
              !a.ready ||
              !a.private ||
              (revision.imageIds.includes(a.id) && a.kind !== "image"),
          ) ||
          !media.some(
            (a) =>
              a.id === revision.videoId && a.kind === "video" && a.duration > 0,
          )
        )
          throw new HttpError(
            400,
            "All media must be verified and the video must have a duration before publishing.",
          );
        await tx
          .update(lessons)
          .set({ publishedRevisionId: revision.id, retiredAt: null })
          .where(eq(lessons.id, data.id));
        return { saved: true };
      }
      if (data.action === "retire-lesson") {
        const lesson = await tx.query.lessons.findFirst({
          where: eq(lessons.id, data.id),
        });
        if (lesson?.publishedRevisionId)
          await tx
            .update(lessons)
            .set({ retiredAt: new Date() })
            .where(eq(lessons.id, data.id));
        else await tx.delete(lessons).where(eq(lessons.id, data.id));
        return { saved: true };
      }
      if (data.action === "reorder") {
        const table = data.kind === "sections" ? sections : lessons;
        const parent =
          data.kind === "sections"
            ? eq(sections.courseId, data.parentId)
            : eq(lessons.sectionId, data.parentId);
        const current = await tx
          .select({ id: table.id })
          .from(table)
          .where(parent);
        if (
          new Set(data.ids).size !== data.ids.length ||
          current.length !== data.ids.length ||
          current.some((r) => !data.ids.includes(r.id))
        )
          throw new HttpError(
            409,
            "The curriculum changed. Refresh and try again.",
          );
        for (const [position, itemId] of data.ids.entries())
          await tx.update(table).set({ position }).where(eq(table.id, itemId));
        return { saved: true };
      }
      if (data.action === "offer") {
        if ((data.kind === "course") !== !!data.courseId)
          throw new HttpError(
            400,
            "Course products must be linked to a course.",
          );
        const product = providerProduct.parse(
          await polarApi("/products/" + encodeURIComponent(data.productId)),
        );
        const price = offerPrice(product, data.kind);
        if (!price)
          throw new HttpError(
            400,
            "Use one active, fixed USD price with the billing interval matching this offer.",
          );
        const values = {
          kind: data.kind,
          courseId: data.courseId,
          productId: product.id,
          amount: price.price_amount!,
          currency: "usd",
          active: true,
        };
        const previous = await tx.query.offers.findFirst({
          where: data.courseId
            ? eq(offers.courseId, data.courseId)
            : eq(offers.kind, data.kind),
        });
        if (previous && previous.productId !== product.id)
          throw new HttpError(
            409,
            "Keep the linked product ID stable to preserve purchase history. Change its price in Polar instead.",
          );
        if (previous)
          await tx.update(offers).set(values).where(eq(offers.id, previous.id));
        else await tx.insert(offers).values(values);
        return { saved: true };
      }
      if (data.action === "refund-response") {
        await tx
          .update(refundRequests)
          .set({
            response: data.response,
            ...(data.decline ? { status: "declined" as const } : {}),
          })
          .where(
            and(
              eq(refundRequests.id, data.id),
              eq(refundRequests.status, "pending"),
            ),
          );
        return { saved: true };
      }
      if (data.action === "policy") {
        const value = { content: data.content };
        await tx
          .insert(settings)
          .values({ key: "policy:" + data.key, value })
          .onConflictDoUpdate({ target: settings.key, set: { value } });
        return { saved: true };
      }
      if (data.action === "business") {
        const { action: _, ...value } = data;
        void _;
        await tx
          .insert(settings)
          .values({ key: "business", value })
          .onConflictDoUpdate({ target: settings.key, set: { value } });
        return { saved: true };
      }
    }),
  );
  revalidateTag("catalog", "max");
  return result || { saved: true };
}
