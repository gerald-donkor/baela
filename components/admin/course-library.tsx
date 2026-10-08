"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ManagedImage } from "@/components/managed-image";
import { CourseStatus } from "./studio-ui";
import styles from "./studio.module.css";

export type StudioCourse = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: string;
  coverId: string | null;
  createdAt: string;
  sectionCount: number;
  lessonCount: number;
  publishedLessonCount: number;
};
export function StudioCourseLibrary({ courses }: { courses: StudioCourse[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const filtered = courses
    .filter(
      (course) =>
        (status === "all" || course.status === status) &&
        `${course.title} ${course.summary} ${course.slug}`
          .toLowerCase()
          .includes(query.toLowerCase().trim()),
    )
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : b.createdAt.localeCompare(a.createdAt),
    );
  return (
    <section className={styles.library} aria-label="Course library">
      <div className={styles.libraryTop}>
        <div>
          <h2>Course library</h2>
          <p>Everything you’re creating, in one place.</p>
        </div>
        <span className={styles.count}>
          {courses.length} {courses.length === 1 ? "course" : "courses"}
        </span>
      </div>
      <div className={styles.filters}>
        <div
          className={styles.statusFilters}
          role="group"
          aria-label="Filter courses by status"
        >
          {["all", "draft", "published", "archived"].map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={status === value}
              className={
                status === value ? styles.filterActive : styles.filterButton
              }
              onClick={() => setStatus(value)}
            >
              {value === "all"
                ? "All courses"
                : value === "draft"
                  ? "Drafts"
                  : value === "published"
                    ? "Published"
                    : "Archived"}
              <span>
                {
                  courses.filter(
                    (course) => value === "all" || course.status === value,
                  ).length
                }
              </span>
            </button>
          ))}
        </div>
        <div className={styles.searchRow}>
          <label className={styles.search}>
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              aria-label="Search courses"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your courses…"
            />
          </label>
          <label className={styles.sort}>
            <SlidersHorizontal size={15} aria-hidden="true" />
            <select
              aria-label="Sort courses"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="title">Title A–Z</option>
            </select>
          </label>
        </div>
      </div>
      <div className={styles.courseRows}>
        {filtered.map((course) => (
          <article key={course.id} className={styles.courseRow}>
            <div className={styles.courseCover}>
              {course.coverId ? (
                <ManagedImage assetId={course.coverId} alt="" editor />
              ) : (
                <BookOpen size={24} strokeWidth={1.3} />
              )}
            </div>
            <Link
              href={`/admin/courses/${course.id}`}
              className={styles.courseLink}
            >
              <div className={styles.courseInfo}>
                <CourseStatus status={course.status} />
                <h3>{course.title}</h3>
                <p>
                  {course.summary ||
                    "Add a description to introduce your course."}
                </p>
                <span className={styles.courseMeta}>
                  {course.sectionCount}{" "}
                  {course.sectionCount === 1 ? "section" : "sections"}
                  <i />
                  {course.lessonCount}{" "}
                  {course.lessonCount === 1 ? "lesson" : "lessons"}
                  <i />
                  {course.publishedLessonCount} published
                </span>
              </div>
              <span className={styles.openCourse}>
                <ArrowUpRight size={18} />
              </span>
              <span className="sr-only">Edit {course.title}</span>
            </Link>
          </article>
        ))}
        {!filtered.length && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>
              <BookOpen size={27} strokeWidth={1.4} />
            </span>
            <h3>
              {courses.length
                ? "No courses match your search."
                : "Your next chapter starts here."}
            </h3>
            <p>
              {courses.length
                ? "Try a different title or course status."
                : "Turn what you know into something someone else can learn. Create your first course to get started."}
            </p>
            {courses.length ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                }}
              >
                Clear filters
              </Button>
            ) : (
              <span className={styles.emptyNote}>
                Start with the New course button above.
              </span>
            )}
          </div>
        )}
      </div>
      <div className={styles.libraryFooter}>
        Showing {filtered.length} of {courses.length}{" "}
        {courses.length === 1 ? "course" : "courses"}
        <span>Drafts are visible only to you</span>
      </div>
    </section>
  );
}
