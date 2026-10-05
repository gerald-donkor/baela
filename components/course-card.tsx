/* eslint-disable @next/next/no-img-element -- ImageKit already transforms and signs these private images. */
import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { LearningProgress } from "@/components/ui/learning-progress";
import { money } from "@/lib/utils";
export function CourseCard({
  course,
  amount,
  href,
  percentage,
}: {
  course: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    coverId?: string | null;
  };
  amount?: number;
  href?: string;
  percentage?: number;
}) {
  return (
    <Link
      href={href || "/courses/" + course.slug}
      className="group overflow-hidden rounded-card border bg-card hover:border-primary/35 hover:shadow-[var(--shadow-glow)] transition-[border-color,box-shadow]"
    >
      <div className="course-art h-44 flex items-center justify-center">
        {course.coverId ? (
          <img
            src={"/api/covers/" + course.id}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <BookOpen className="size-14 text-primary/70" strokeWidth={1} />
        )}
      </div>
      <div className="p-6">
        <div className="flex justify-between gap-3">
          <h3 className="font-semibold text-xl tracking-tight">
            {course.title}
          </h3>
          <ArrowUpRight className="size-5 shrink-0" />
        </div>
        <p className="text-muted-foreground mt-3 text-sm line-clamp-2">
          {course.summary}
        </p>
        {percentage !== undefined ? (
          <LearningProgress value={percentage} className="mt-5" />
        ) : amount !== undefined ? (
          <p className="mt-5 text-sm font-medium">
            {money(amount)}{" "}
            <span className="text-muted-foreground font-normal">
              · One-time purchase
            </span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}
