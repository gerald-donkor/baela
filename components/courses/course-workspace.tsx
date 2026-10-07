import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CirclePlay,
  Clock3,
  GraduationCap,
  Layers3,
  Sparkles,
} from "lucide-react";
import { Brand } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import {
  courseLessons,
  currentLesson,
  lessonHref,
  sampleProgress,
  type SampleCourse,
  type SampleLesson,
} from "@/lib/sample-courses";
import { CourseArt } from "./course-art";
import { LessonPreview } from "./lesson-preview";
import { LessonTabs } from "./lesson-tabs";
import styles from "./course-ui.module.css";

function Curriculum({
  course,
  lesson,
}: {
  course: SampleCourse;
  lesson?: SampleLesson;
}) {
  return (
    <>
      <Link href="/courses" className={styles.backLink}>
        <ArrowLeft size={14} /> All courses
      </Link>
      <div className={styles.curriculumHeading}>
        <h2>{course.title}</h2>
        <p>{course.summary}</p>
        <span>
          <BookOpen size={13} /> 12 lessons <i /> {course.duration}
        </span>
      </div>
      <Link
        href={`/courses/${course.slug}`}
        className={styles.overviewLink}
        aria-current={!lesson ? "page" : undefined}
      >
        <Layers3 size={15} /> Course overview
      </Link>
      <nav aria-label="Course curriculum" className={styles.curriculumList}>
        {course.sections.map((section) => (
          <details
            key={section.title}
            open
            className={styles.curriculumSection}
          >
            <summary>
              <span>{section.title}</span>
              <small>
                {
                  section.lessons.filter(
                    (item) => item.number <= course.completed,
                  ).length
                }{" "}
                / {section.lessons.length}
              </small>
              <ChevronDown size={13} />
            </summary>
            <div>
              {section.lessons.map((item) => (
                <Link
                  key={item.id}
                  href={lessonHref(course, item)}
                  aria-current={lesson?.id === item.id ? "page" : undefined}
                  className={styles.curriculumLesson}
                >
                  <span
                    className={
                      item.number <= course.completed
                        ? styles.completedDot
                        : styles.lessonDot
                    }
                  >
                    {item.number <= course.completed ? (
                      <Check size={11} strokeWidth={3} />
                    ) : lesson?.id === item.id ? (
                      <PlayMark />
                    ) : (
                      <CirclePlay size={12} />
                    )}
                  </span>
                  <span>
                    {item.number}. {item.title}
                  </span>
                  <small>{item.duration}</small>
                </Link>
              ))}
            </div>
          </details>
        ))}
      </nav>
      <div className={styles.curriculumFooter}>
        <Sparkles size={17} />
        <p>
          Small steps.
          <br />
          <span>Endless possibilities.</span>
        </p>
      </div>
    </>
  );
}

function PlayMark() {
  return <span className={styles.tinyPlay} />;
}

function ProgressPanel({
  course,
  lesson,
}: {
  course: SampleCourse;
  lesson?: SampleLesson;
}) {
  const all = courseLessons(course);
  const next = lesson ? all[lesson.number] : currentLesson(course);
  const progress = sampleProgress(course);
  return (
    <aside className={styles.progressSidebar} aria-label="Course progress">
      <section className={styles.progressBlock}>
        <h2>Your progress</h2>
        <div className={styles.progressSummary}>
          <div
            className={styles.progressRing}
            role="progressbar"
            aria-label={`${course.title} progress`}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <svg viewBox="0 0 84 84" aria-hidden="true">
              <circle cx="42" cy="42" r="35" className={styles.ringTrack} />
              <circle
                cx="42"
                cy="42"
                r="35"
                className={styles.ringFill}
                pathLength="100"
                strokeDasharray={`${progress} 100`}
              />
            </svg>
            <strong>
              {progress}
              <small>%</small>
            </strong>
          </div>
          <p>
            <strong>
              {course.completed} of {all.length} lessons
            </strong>
            <span>completed</span>
          </p>
        </div>
        <div className={styles.progressTrack} aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className={styles.progressMessage}>
          {progress === 100
            ? "A chapter finished. A new skill unlocked."
            : progress === 0
              ? "Every new skill starts with one small step."
              : "You’re making room for something good."}
        </p>
      </section>
      <section className={styles.nextBlock}>
        <h2>{next ? "Up next" : "Course complete"}</h2>
        {next ? (
          <Link href={lessonHref(course, next)} className={styles.nextLesson}>
            <span className={styles.nextIcon}>
              <CirclePlay size={19} />
            </span>
            <div>
              <small>
                Lesson {next.number} · {next.duration}
              </small>
              <h3>{next.title}</h3>
              <p>{next.goal}</p>
            </div>
            <ChevronRight size={16} />
          </Link>
        ) : (
          <div className={styles.completionNote}>
            <Award size={24} />
            <p>
              You’ve reached the last lesson. Revisit a favorite or explore your
              next course.
            </p>
            <Link href="/courses">
              Explore courses <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </section>
      <section className={styles.instructorBlock}>
        <h2>Your guide</h2>
        <div>
          <span className={styles.instructorAvatar}>
            {course.instructor.initials}
          </span>
          <p>
            <strong>{course.instructor.name}</strong>
            <small>{course.instructor.role}</small>
          </p>
        </div>
      </section>
      <div className={styles.learningNote}>
        <Sparkles size={17} />
        <p>
          At your pace.
          <br />
          <span>On your terms.</span>
        </p>
      </div>
      <p className={styles.sampleNotice}>Sample course & learning progress</p>
    </aside>
  );
}

function CourseOverview({ course }: { course: SampleCourse }) {
  return (
    <article className={styles.overviewContent}>
      <div className={styles.overviewArt}>
        <CourseArt course={course} placement="overview" />
      </div>
      <div className={styles.courseIntro}>
        <div className={styles.courseMeta}>
          <span>{course.category}</span>
          <span>{course.level}</span>
        </div>
        <h1>{course.title}</h1>
        <p>{course.description}</p>
        <div className={styles.overviewStats}>
          <span>
            <Clock3 size={15} /> {course.duration}
          </span>
          <span>
            <BookOpen size={15} /> 12 lessons
          </span>
          <span>
            <GraduationCap size={16} /> {course.students} sample learners
          </span>
        </div>
        <Button asChild>
          <Link href={lessonHref(course)}>
            {course.completed === 12
              ? "Revisit the course"
              : course.completed
                ? "Continue learning"
                : "Start learning"}
            <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
      <section className={styles.outcomes}>
        <h2>A few things you’ll take with you</h2>
        <div>
          {course.outcomes.map((outcome) => (
            <p key={outcome}>
              <Check size={16} />
              {outcome}
            </p>
          ))}
        </div>
      </section>
      <section className={styles.projectBlock}>
        <span className={styles.projectIcon}>
          <Layers3 size={24} />
        </span>
        <div>
          <span>Your course project</span>
          <h2>Make the ideas your own.</h2>
          <p>{course.project}</p>
        </div>
      </section>
      <section className={styles.sectionOverview}>
        <h2>Your path through the course</h2>
        {course.sections.map((section, i) => (
          <Link
            href={lessonHref(course, section.lessons[0])}
            key={section.title}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3>{section.title}</h3>
              <p>{section.lessons.map((item) => item.title).join(" · ")}</p>
            </div>
            <small>4 lessons</small>
            <ChevronRight size={16} />
          </Link>
        ))}
      </section>
    </article>
  );
}

function LessonContent({
  course,
  lesson,
  compact,
}: {
  course: SampleCourse;
  lesson: SampleLesson;
  compact: boolean;
}) {
  const previous = courseLessons(course)[lesson.number - 2];
  const next = courseLessons(course)[lesson.number];
  const Heading = compact ? "h3" : "h1";
  return (
    <article className={styles.lessonContent}>
      <LessonPreview course={course} lesson={lesson} />
      <div className={styles.lessonHeading}>
        <p className={styles.lessonEyebrow}>
          Lesson {String(lesson.number).padStart(2, "0")} <span>/</span>{" "}
          {lesson.section}
        </p>
        <Heading>{lesson.title}</Heading>
        <p>{lesson.goal}</p>
      </div>
      <div className={styles.lessonActions}>
        <Button disabled title="Completion is a sample state in this UI">
          <CheckCheck size={15} />
          {lesson.number <= course.completed
            ? "Lesson completed"
            : "Mark complete"}
        </Button>
        {next ? (
          <Button asChild variant="outline">
            <Link href={lessonHref(course, next)}>
              Next lesson <ChevronRight size={15} />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/courses">
              Explore courses <ArrowRight size={15} />
            </Link>
          </Button>
        )}
      </div>
      {compact ? (
        <div className={styles.previewOverview}>
          <div>
            <span>Overview</span>
            <span>
              Resources <small>2</small>
            </span>
          </div>
          <h4>What you’ll learn</h4>
          <p>
            <Check size={13} /> Create a session-aware experience
          </p>
          <p>
            <Check size={13} /> Keep your workspace pages protected
          </p>
          <p>
            <Check size={13} /> Connect authentication to your app
          </p>
        </div>
      ) : (
        <>
          <LessonTabs course={course} lesson={lesson} />
          <div className={styles.lessonPagination}>
            {previous ? (
              <Link href={lessonHref(course, previous)}>
                <ArrowLeft size={15} />
                <span>
                  <small>Previous lesson</small>
                  {previous.title}
                </span>
              </Link>
            ) : (
              <Link href={`/courses/${course.slug}`}>
                <ArrowLeft size={15} />
                Course overview
              </Link>
            )}
            {next ? (
              <Link href={lessonHref(course, next)}>
                <span>
                  <small>Next lesson</small>
                  {next.title}
                </span>
                <ArrowRight size={15} />
              </Link>
            ) : (
              <Link href="/courses">
                <span>Find your next chapter</span>
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </>
      )}
    </article>
  );
}

export function CourseWorkspace({
  course,
  lesson,
  compact = false,
}: {
  course: SampleCourse;
  lesson?: SampleLesson;
  compact?: boolean;
}) {
  return (
    <div className={compact ? styles.compactWorkspace : styles.platform}>
      <div className={styles.workspaceHeader}>
        <Link
          href="/"
          aria-label="Baela home"
          className={styles.workspaceBrand}
        >
          <Brand />
        </Link>
        <nav aria-label="Breadcrumb">
          <Link href="/courses">Courses</Link>
          <ChevronRight size={12} />
          <Link href={`/courses/${course.slug}`}>{course.title}</Link>
          {lesson && (
            <>
              <ChevronRight size={12} />
              <span>Lesson {lesson.number}</span>
            </>
          )}
        </nav>
        <div className={styles.workspaceAccount}>
          <span className={styles.samplePill}>Sample workspace</span>
          <span
            className={styles.userAvatar}
            aria-label="Sample student Jamie Parker"
          >
            JP
          </span>
        </div>
      </div>
      <div className={styles.workspaceGrid}>
        <aside className={styles.desktopCurriculum}>
          <Curriculum course={course} lesson={lesson} />
        </aside>
        <details className={styles.mobileCurriculum}>
          <summary>
            <BookOpen size={16} />
            <span>Course content</span>
            <small>
              {lesson ? `Lesson ${lesson.number} of 12` : "12 lessons"}
            </small>
            <ChevronDown size={16} />
          </summary>
          <div>
            <Curriculum course={course} lesson={lesson} />
          </div>
        </details>
        <div className={styles.workspaceContent}>
          {lesson ? (
            <LessonContent course={course} lesson={lesson} compact={compact} />
          ) : (
            <CourseOverview course={course} />
          )}
        </div>
        <ProgressPanel course={course} lesson={lesson} />
      </div>
    </div>
  );
}
