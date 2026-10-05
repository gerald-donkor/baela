import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { getViewer } from "@/lib/auth/server";
import { withDb } from "@/lib/db";
import { assets, progress } from "@/lib/db/schema";
import {
  authorizedLesson,
  curriculum,
  courseDetail,
  grantsFor,
} from "@/lib/server/catalog";
import { evaluateAccess } from "@/lib/domain/access";
import { LessonCurriculum } from "@/components/lesson-curriculum";
import { HttpError } from "@/lib/http";
import { LessonPlayer, DownloadAttachment } from "@/components/lesson-player";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
export const metadata = {
  title: "Learn",
  robots: { index: false, follow: false },
};
export default async function LearnPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}) {
  const { courseSlug, lessonId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(lessonId)) notFound();
  const user = await getViewer();
  let data;
  try {
    data = await withDb(async (db) => {
      const row = await authorizedLesson(
        db,
        lessonId,
        user?.state === "active" ? user.id : undefined,
        user?.state === "active" && user.admin,
      );
      if (row.course.slug !== courseSlug) throw new HttpError(404, "Not found");
      return {
        row,
        grants: await grantsFor(
          db,
          user?.state === "active" ? user.id : undefined,
        ),
        progress: user
          ? await db.select().from(progress).where(eq(progress.userId, user.id))
          : [],
        list: await curriculum(db, row.course.id),
        saved: user
          ? await db.query.progress.findFirst({
              where: and(
                eq(progress.userId, user.id),
                eq(progress.lessonId, lessonId),
              ),
            })
          : null,
        downloads: row.revision.attachmentIds.length
          ? await db
              .select()
              .from(assets)
              .where(inArray(assets.id, row.revision.attachmentIds))
          : [],
      };
    });
  } catch (error) {
    if (error instanceof HttpError && error.status === 403) {
      const course = await courseDetail(courseSlug);
      if (!course) notFound();
      return (
        <div className="shell py-24 text-center">
          <p className="eyebrow">There’s more to explore</p>
          <h1 className="text-3xl font-medium mt-4">Unlock this lesson.</h1>
          <p className="my-6 text-muted-foreground">
            Get this course or an all-access plan to keep learning.
          </p>
          <Button asChild>
            <Link href={"/courses/" + courseSlug}>View course options</Link>
          </Button>
        </div>
      );
    }
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }
  const index = data.list.findIndex((r) => r.lesson.id === lessonId),
    next = data.list[index + 1],
    previous = data.list[index - 1];
  return (
    <div className="shell py-10">
      <Link
        href={"/courses/" + courseSlug}
        className="text-sm text-muted-foreground"
      >
        ← {data.row.course.title}
      </Link>
      <div className="grid lg:grid-cols-[1fr_290px] gap-10 mt-7">
        <article>
          <h1 className="text-3xl font-medium mb-6">
            {data.row.revision.title}
          </h1>
          <LessonPlayer
            key={lessonId}
            lessonId={lessonId}
            signedIn={!!user && user.state === "active"}
            position={data.saved?.position}
            completed={data.saved?.completed}
          />
          <div className="mt-10">
            <Markdown
              content={data.row.revision.markdown}
              lessonId={lessonId}
            />
          </div>
          {data.downloads.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-medium mb-4">Lesson resources</h2>
              <div className="flex gap-3 flex-wrap">
                {data.downloads.map((a) => (
                  <DownloadAttachment
                    key={a.id}
                    lessonId={lessonId}
                    assetId={a.id}
                    name={a.name}
                  />
                ))}
              </div>
            </section>
          )}
          <div className="border-t mt-10 pt-6 flex justify-between gap-4">
            {previous ? (
              <Link href={"/learn/" + courseSlug + "/" + previous.lesson.id}>
                ← Previous lesson
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={"/learn/" + courseSlug + "/" + next.lesson.id}>
                Next lesson →
              </Link>
            ) : (
              <Link href="/dashboard">Back to my learning →</Link>
            )}
          </div>
        </article>
        <LessonCurriculum
          current={lessonId}
          entries={data.list.map((item) => ({
            id: item.lesson.id,
            title: item.revision.title,
            section: item.section.title,
            href: "/learn/" + courseSlug + "/" + item.lesson.id,
            locked:
              !user?.admin &&
              !evaluateAccess(
                data.row.course.id,
                item.revision.preview,
                true,
                data.grants,
              ).allowed,
            completed: data.progress.some(
              (saved) => saved.lessonId === item.lesson.id && saved.completed,
            ),
          }))}
        />
      </div>
    </div>
  );
}
