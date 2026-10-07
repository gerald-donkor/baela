import Image from "next/image";
import type { SampleCourse } from "@/lib/sample-courses";
import styles from "./course-ui.module.css";

export function CourseArt({
  course,
  placement = "card",
}: {
  course: SampleCourse;
  placement?: "card" | "feature" | "overview";
}) {
  return (
    <div className={`${styles.courseArt} ${styles.thumbnailArt}`}>
      <Image
        src={course.thumbnail}
        alt=""
        fill
        sizes={
          placement === "overview"
            ? "(max-width: 640px) 100vw, 65vw"
            : placement === "feature"
              ? "(max-width: 640px) 30vw, 25vw"
              : "(max-width: 640px) 100vw, (max-width: 1050px) 50vw, 33vw"
        }
        className={styles.thumbnailImage}
      />
    </div>
  );
}
