"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CirclePlay,
  Clock3,
  LayoutDashboard,
  Search,
  Sparkles,
} from "lucide-react";
import { Brand } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import {
  courseLessons,
  currentLesson,
  lessonHref,
  sampleCourses,
  sampleProgress,
  type SampleCourse,
} from "@/lib/sample-courses";
import { CourseArt } from "./course-art";
import styles from "./course-ui.module.css";

export function SampleCourseCard({
  course,
  showProgress = false,
}: {
  course: SampleCourse;
  showProgress?: boolean;
}) {
  const progress = sampleProgress(course);
  return (
    <Link href={`/courses/${course.slug}`} className={styles.courseCard}>
      <CourseArt course={course} />
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span>{course.level}</span>
          <span>{course.instructor.name}</span>
        </div>
        <h3>
          {course.title}
          <span>
            <ArrowRight size={17} />
          </span>
        </h3>
        <p>{course.summary}</p>
        <div className={styles.cardDetails}>
          <span>
            <BookOpen size={13} /> {courseLessons(course).length} lessons
          </span>
          <span>
            <Clock3 size={13} /> {course.duration}
          </span>
        </div>
        {showProgress && (
          <div className={styles.cardProgress}>
            <div>
              <span>
                {progress === 100 ? (
                  <>
                    <Check size={12} /> Completed
                  </>
                ) : progress ? (
                  "In progress"
                ) : (
                  "Ready when you are"
                )}
              </span>
              <span>{progress}%</span>
            </div>
            <div className={styles.progressTrack}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export function SampleCourseGrid() {
  return (
    <div className={styles.courseGrid}>
      {sampleCourses.map((course) => (
        <SampleCourseCard course={course} key={course.slug} />
      ))}
    </div>
  );
}

export function CourseLibrary({ dashboard = false }: { dashboard?: boolean }) {
  const [category, setCategory] = useState("All courses");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recommended");
  const featured = sampleCourses[0];
  const lesson = currentLesson(featured);
  const courses = sampleCourses.filter(
    (course) =>
      (category === "All courses" || course.category === category) &&
      `${course.title} ${course.summary} ${course.instructor.name}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  if (sort === "title") courses.sort((a, b) => a.title.localeCompare(b.title));
  return (
    <div className={`${styles.platform} ${styles.libraryShell}`}>
      <aside className={styles.librarySidebar}>
        <Link href="/" aria-label="Baela home">
          <Brand />
        </Link>
        <p className={styles.navLabel}>Your learning space</p>
        <nav aria-label="Learning navigation">
          <Link href="/dashboard" aria-current={dashboard ? "page" : undefined}>
            <LayoutDashboard size={17} /> My learning
          </Link>
          <Link href="/courses" aria-current={!dashboard ? "page" : undefined}>
            <BookOpen size={17} /> Course collection
          </Link>
        </nav>
        <div className={styles.sidebarInvitation}>
          <span className={styles.smallStar}>
            <Sparkles size={22} />
          </span>
          <h2>
            A little curiosity.
            <br />A world of possibility.
          </h2>
          <p>
            Make time for the things
            <br />
            you’ve always wanted to learn.
          </p>
        </div>
        <div className={styles.studentProfile}>
          <span className={styles.userAvatar}>JP</span>
          <div>
            <strong>Jamie Parker</strong>
            <small>Sample student</small>
          </div>
        </div>
      </aside>
      <div className={styles.libraryMain}>
        <div className={styles.libraryTopbar}>
          <span>
            {dashboard
              ? "Workspace / My learning"
              : "Workspace / Course collection"}
          </span>
          <div>
            <span className={styles.samplePill}>Sample workspace</span>
            <Link href="/" className={styles.backToSite}>
              Back to Baela <ArrowRight size={13} />
            </Link>
          </div>
        </div>
        <div className={styles.libraryContent}>
          <div className={styles.libraryHeading}>
            <div>
              <p>
                {dashboard ? "Good to see you, Jamie" : "Follow your curiosity"}
              </p>
              <h1>
                {dashboard
                  ? "A little progress, every day."
                  : "Your next chapter starts here."}
              </h1>
              <span>
                {dashboard
                  ? "Pick up where you left off. There’s more to discover."
                  : "Six thoughtful courses. A whole world of things you can do."}
              </span>
            </div>
            <span className={styles.collectionCount}>
              <BookOpen size={16} />6 courses
            </span>
          </div>
          <section
            className={styles.continueFeature}
            aria-label="Continue your course"
          >
            <div className={styles.continueArt}>
              <CourseArt course={featured} placement="feature" />
            </div>
            <div className={styles.continueContent}>
              <p>
                <span className={styles.statusDot} />{" "}
                {dashboard ? "Continue learning" : "Your current chapter"}
              </p>
              <h2>{featured.title}</h2>
              <span>Next up: {lesson.title}</span>
              <div className={styles.featureProgress}>
                <div>
                  <span>6 of 12 lessons completed</span>
                  <strong>50%</strong>
                </div>
                <div className={styles.progressTrack}>
                  <span style={{ width: "50%" }} />
                </div>
              </div>
              <Button asChild>
                <Link href={lessonHref(featured)}>
                  <CirclePlay size={16} /> Continue lesson{" "}
                  <ArrowRight size={15} />
                </Link>
              </Button>
            </div>
            <div className={styles.featureNote}>
              <Sparkles size={22} />
              <p>
                Small steps.
                <br />
                Real possibilities.
              </p>
              <span>Your sample learning journey</span>
            </div>
          </section>
          <section aria-labelledby="collection-heading">
            <div className={styles.collectionHeading}>
              <h2 id="collection-heading">
                {dashboard ? "Your courses" : "The course collection"}
              </h2>
              <label className={styles.sortLabel}>
                <span className="sr-only">Sort courses</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="recommended">Recommended</option>
                  <option value="title">Course title</option>
                </select>
              </label>
            </div>
            <div className={styles.collectionTools}>
              <div
                className={styles.categoryTabs}
                aria-label="Course categories"
              >
                {["All courses", "Development", "Design", "Creative"].map(
                  (item) => (
                    <button
                      key={item}
                      aria-pressed={category === item}
                      onClick={() => setCategory(item)}
                    >
                      {item}
                      {item === "All courses" && <span>6</span>}
                    </button>
                  ),
                )}
              </div>
              <label className={styles.courseSearch}>
                <Search size={16} />
                <span className="sr-only">Search courses</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  type="search"
                  placeholder="Find your next course…"
                />
              </label>
            </div>
            <div className={styles.courseGrid}>
              {courses.map((course) => (
                <SampleCourseCard
                  key={course.slug}
                  course={course}
                  showProgress={dashboard}
                />
              ))}
            </div>
            {courses.length === 0 && (
              <div className={styles.noResults}>
                <Search size={25} />
                <h3>No courses found</h3>
                <p>Try another title, topic, or instructor.</p>
                <button
                  onClick={() => {
                    setQuery("");
                    setCategory("All courses");
                  }}
                >
                  Show all courses <ChevronRight size={15} />
                </button>
              </div>
            )}
          </section>
          <div className={styles.collectionFooter}>
            <Sparkles size={15} />
            <span>At your pace. On your terms.</span>
            <span>Sample courses, profiles, and progress</span>
          </div>
        </div>
      </div>
    </div>
  );
}
