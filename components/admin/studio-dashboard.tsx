import Link from "next/link";
import {
  ArrowUpRight,
  CloudUpload,
  CircleCheck,
  CircleDashed,
} from "lucide-react";
import { StudioCourseLibrary, type StudioCourse } from "./course-library";
import { NewCourseDialog } from "./new-course-dialog";
import { StudioHeading, StudioPanel } from "./studio-ui";
import styles from "./studio.module.css";

export function StudioDashboard({
  items,
  studentCount,
  imagekitReady,
}: {
  items: StudioCourse[];
  studentCount: number;
  imagekitReady: boolean;
}) {
  return (
    <>
      <StudioHeading
        title="Your courses"
        description="A space for what you know, and what you’ll teach next."
        action={<NewCourseDialog />}
      />
      <section className={styles.welcome}>
        <h2>Good things take shape, one lesson at a time.</h2>
        <p>
          Create a course, build its curriculum, and share it when it’s ready.
          Your drafts stay yours until you publish.
        </p>
        <div className={styles.stats}>
          {[
            { label: "Total courses", value: items.length },
            {
              label: "Published",
              value: items.filter((c) => c.status === "published").length,
            },
            {
              label: "In draft",
              value: items.filter((c) => c.status === "draft").length,
            },
            { label: "Active students", value: studentCount },
          ].map(({ label, value }) => (
            <div key={label} className={styles.stat}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>
      <div className={styles.overviewGrid}>
        <StudioCourseLibrary courses={items} />
        <aside className={styles.guide}>
          <StudioPanel>
            <h2>From idea to published.</h2>
            <p className={styles.panelDescription}>
              A few steps to your next course.
            </p>
            <ol className={styles.guideList}>
              {[
                {
                  title: "Set the scene",
                  text: "Add a title, description, and course cover.",
                },
                {
                  title: "Build your curriculum",
                  text: "Organize sections, upload videos, and save lesson drafts.",
                },
                {
                  title: "Make it ready to share",
                  text: "Verify media, publish lessons, connect a price, and publish your course.",
                },
              ].map((step, index) => (
                <li key={step.title} className={styles.guideItem}>
                  <span className={styles.guideNumber}>{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </StudioPanel>
          <StudioPanel>
            <div className={styles.connection}>
              <CloudUpload size={17} />
              ImageKit media
            </div>
            <p className={styles.panelDescription}>
              Your videos, course covers, and lesson resources live together in
              your media library.
            </p>
            <p className={styles.connectionStatus}>
              {imagekitReady ? (
                <CircleCheck size={14} />
              ) : (
                <CircleDashed size={14} />
              )}
              {imagekitReady
                ? "Credentials configured"
                : "Setup needed for uploads"}
            </p>
            <Link
              href={imagekitReady ? "/admin/media" : "/admin/settings"}
              className={styles.textLink}
            >
              {imagekitReady ? "Open media library" : "View setup details"}
              <ArrowUpRight size={14} />
            </Link>
          </StudioPanel>
        </aside>
      </div>
    </>
  );
}
