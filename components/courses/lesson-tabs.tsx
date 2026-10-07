"use client";

import { useId, useState } from "react";
import { Check, FileText, Lightbulb } from "lucide-react";
import type { SampleCourse, SampleLesson } from "@/lib/sample-courses";
import styles from "./course-ui.module.css";

const tabs = ["Overview", "Resources", "Transcript"] as const;

export function LessonTabs({
  course,
  lesson,
}: {
  course: SampleCourse;
  lesson: SampleLesson;
}) {
  const [active, setActive] = useState<(typeof tabs)[number]>("Overview");
  const id = useId();
  return (
    <div className={styles.lessonTabs}>
      <div
        className={styles.tabList}
        role="tablist"
        aria-label="Lesson content"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab}
            id={`${id}-${tab}`}
            role="tab"
            aria-selected={active === tab}
            aria-controls={`${id}-panel`}
            tabIndex={active === tab ? 0 : -1}
            onClick={() => setActive(tab)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % tabs.length
                  : event.key === "ArrowLeft"
                    ? (index + tabs.length - 1) % tabs.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? tabs.length - 1
                        : -1;
              if (next >= 0) {
                event.preventDefault();
                setActive(tabs[next]);
                document.getElementById(`${id}-${tabs[next]}`)?.focus();
              }
            }}
          >
            {tab}
            {tab === "Resources" && <span>2</span>}
          </button>
        ))}
      </div>
      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-${active}`}
        tabIndex={0}
        className={styles.tabPanel}
      >
        {active === "Overview" && (
          <>
            <h2>What you’ll learn</h2>
            <p>{lesson.goal}</p>
            <ul className={styles.takeaways}>
              <li>
                <Check size={15} />
                <span>
                  Understand the key ideas behind {lesson.title.toLowerCase()}.
                </span>
              </li>
              <li>
                <Check size={15} />
                <span>
                  Apply them to{" "}
                  {course.project.charAt(0).toLowerCase() +
                    course.project.slice(1)}
                </span>
              </li>
              <li>
                <Check size={15} />
                <span>
                  Review your work and identify one improvement to try.
                </span>
              </li>
            </ul>
            <div className={styles.practice}>
              <Lightbulb size={19} />
              <div>
                <h3>A small step to try</h3>
                <p>
                  Open your course project and follow the approach from this
                  lesson. Write down what changed, what worked, and one question
                  you want to explore next.
                </p>
              </div>
            </div>
          </>
        )}
        {active === "Resources" && (
          <>
            <h2>Your lesson toolkit</h2>
            <p>
              A few things to keep close while you work through this lesson.
            </p>
            <div className={styles.resourceList}>
              {[
                `${lesson.title} — lesson notes`,
                `${course.shortTitle} — project starter`,
              ].map((title, i) => (
                <div key={title}>
                  <FileText size={21} />
                  <span>
                    <strong>{title}</strong>
                    <small>
                      {i === 0 ? "PDF · 4 pages" : "ZIP · Sample project files"}
                    </small>
                  </span>
                  <span className={styles.samplePill}>Preview only</span>
                </div>
              ))}
            </div>
            <p className={styles.resourceNote}>
              These are sample resources for the course preview.
            </p>
          </>
        )}
        {active === "Transcript" && (
          <>
            <h2>Follow along at your pace</h2>
            <div className={styles.transcript}>
              <p>
                <span>00:00</span>Welcome back. In this lesson, we’re looking at{" "}
                {lesson.title.toLowerCase()}. We’ll take it one step at a time
                and use our project to make the ideas concrete.
              </p>
              <p>
                <span>00:38</span>
                {lesson.goal} Start by looking at the example and noticing the
                decisions that give it structure.
              </p>
              <p>
                <span>02:14</span>Now try the same approach in your own project.
                Pause when you need to, review each change, and keep the parts
                that make the experience clearer.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
