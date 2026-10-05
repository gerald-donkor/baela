import { requireAdminPage } from "@/lib/auth/server";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { withDb } from "@/lib/db";
import { lessons, revisions } from "@/lib/db/schema";
import { LessonPlayer } from "@/components/lesson-player";
import { Markdown } from "@/components/markdown";
export default async function Preview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const revision = await withDb(async (db) => {
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, id),
    });
    return lesson?.draftRevisionId
      ? db.query.revisions.findFirst({
          where: eq(revisions.id, lesson.draftRevisionId),
        })
      : null;
  });
  if (!revision) notFound();
  return (
    <div className="max-w-4xl mx-auto">
      <p className="eyebrow">Private draft preview</p>
      <h1 className="text-3xl font-medium mt-3 mb-7">{revision.title}</h1>
      {revision.videoId && <LessonPlayer lessonId={id} draft />}
      <div className="mt-8">
        <Markdown content={revision.markdown} lessonId={id} draft />
      </div>
    </div>
  );
}
