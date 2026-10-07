import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CourseWorkspace } from "@/components/courses/course-workspace";
import { currentLesson, sampleCourses } from "@/lib/sample-courses";
import styles from "./learning-demo.module.css";

export function LearningDemo() {
  const course = sampleCourses[0];
  return (
    <section
      id="demo"
      aria-label="Learning workspace preview"
      className={styles.frame}
    >
      <div className={styles.windowBar}>
        <div className={styles.windowDots} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span>baela / your learning space</span>
        <span className={styles.previewLabel}>A look inside</span>
      </div>
      <CourseWorkspace course={course} lesson={currentLesson(course)} compact />
      <div className={styles.statusBar}>
        <span>
          <i /> A little preview of your next chapter.
        </span>
        <Link href="/courses">
          Explore the workspace <ArrowUpRight size={12} />
        </Link>
      </div>
    </section>
  );
}
