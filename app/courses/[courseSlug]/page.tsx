import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Play, ArrowRight } from "lucide-react";
import { courseDetail, grantsFor } from "@/lib/server/catalog";
import { getViewer } from "@/lib/auth/server";
import { withDb } from "@/lib/db";
import { evaluateAccess } from "@/lib/domain/access";
import { money } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/checkout-button";
import { LessonPlayer } from "@/components/lesson-player";
import { Markdown } from "@/components/markdown";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const detail = await courseDetail(courseSlug);
  return {
    title: detail?.course.title || "Course",
    description: detail?.course.summary,
    alternates: { canonical: "/courses/" + courseSlug },
    robots: detail?.course.status === "archived" ? { index: false } : undefined,
  };
}
export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params,
    detail = await courseDetail(courseSlug);
  if (!detail) notFound();
  const user = await getViewer();
  const grants = user ? await withDb((db) => grantsFor(db, user.id)) : [];
  const owned =
    evaluateAccess(detail.course.id, false, true, grants).allowed ||
    user?.admin;
  const preview = detail.curriculum.find((l) => l.preview),
    first = detail.curriculum[0];
  return (
    <div className="shell py-14">
      <Link href="/#courses" className="text-sm text-muted-foreground">
        ← All courses
      </Link>
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12 mt-8">
        <div>
          <p className="eyebrow">Your next chapter</p>
          <h1 className="text-4xl sm:text-5xl tracking-tight font-medium mt-4">
            {detail.course.title}
          </h1>
          <p className="text-lg text-muted-foreground my-6">
            {detail.course.summary}
          </p>
          {preview && <LessonPlayer lessonId={preview.id} />}
          <div className="mt-10">
            <Markdown content={detail.course.description} />
          </div>
          <h2 className="text-2xl font-medium mt-12 mb-6">What you’ll learn</h2>
          <div className="border rounded-2xl divide-y overflow-hidden">
            {detail.curriculum.map((lesson, i) => (
              <div key={lesson.id} className="p-5 bg-card">
                <p className="text-xs text-muted-foreground mb-2">
                  {lesson.section}
                </p>
                <Link
                  className="flex items-center gap-3"
                  href={"/learn/" + courseSlug + "/" + lesson.id}
                >
                  {owned || lesson.preview ? (
                    <Play className="size-4 text-primary" />
                  ) : (
                    <Lock className="size-4 text-muted-foreground" />
                  )}
                  <span className="text-sm flex-1">
                    {i + 1}. {lesson.title}
                  </span>
                  {lesson.preview && (
                    <span className="text-xs text-primary">Free preview</span>
                  )}
                </Link>
              </div>
            ))}
          </div>
        </div>
        <aside>
          <div className="rounded-2xl border p-7 bg-card lg:sticky lg:top-8">
            <h2 className="text-xl font-medium">Make it your next step.</h2>
            {owned ? (
              <>
                <p className="text-muted-foreground my-5">
                  This course is part of your learning library.
                </p>
                {first && (
                  <Button asChild className="w-full">
                    <Link href={"/learn/" + courseSlug + "/" + first.id}>
                      Start learning <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                )}
              </>
            ) : detail.course.status === "archived" ? (
              <p className="my-5 text-muted-foreground">
                This course is archived and is no longer sold individually.
              </p>
            ) : (
              <>
                <p className="text-4xl font-medium my-6">
                  {detail.offer ? money(detail.offer.amount) : "Coming soon"}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  One payment. Permanent access. Future course updates included.
                </p>
                <CheckoutButton offerId={detail.offer?.id} className="w-full">
                  Buy this course
                </CheckoutButton>
                <p className="text-sm mt-5 text-center">
                  <Link href="/#pricing" className="underline">
                    Explore all-access plans
                  </Link>
                </p>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
