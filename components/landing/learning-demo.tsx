"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CirclePlay,
  LayoutDashboard,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Brand } from "@/components/ui/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LearningProgress } from "@/components/ui/learning-progress";
import styles from "./learning-demo.module.css";

const lessons = [
  {
    title: "Start with a little curiosity",
    duration: "3 min read",
    subtitle: "A small question can open a whole new chapter.",
    body: "Think of something you have always wanted to understand. It does not need to be a big ambition. A simple question is enough to give your learning a direction.",
    exercise:
      "Write down one question you would love to answer. That is your starting point.",
  },
  {
    title: "Make space to focus",
    duration: "4 min read",
    subtitle: "Give your curiosity a little room to grow.",
    body: "Choose a small window in your day and make it your own. Put distractions aside, find a comfortable place, and focus on just one idea. Consistency matters more than the length of a session.",
    exercise:
      "Pick a ten-minute window for learning tomorrow. Add it to your calendar.",
  },
  {
    title: "Turn knowledge into practice",
    duration: "5 min read",
    subtitle: "The best way to learn something is to try it.",
    body: "Take one idea from your last lesson and use it in a small, real situation. Notice what worked, what surprised you, and what you might try differently next time.",
    exercise:
      "Choose one thing you learned today. Find a simple way to put it into practice.",
  },
];

export function LearningDemo() {
  const [view, setView] = useState<"overview" | "lesson">("overview");
  const [selected, setSelected] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const lesson = lessons[selected];
  const percentage = (completed.length / lessons.length) * 100;
  function openLesson(index: number) {
    setSelected(index);
    setView("lesson");
  }
  function toggleComplete() {
    setCompleted((previous) =>
      previous.includes(selected)
        ? previous.filter((index) => index !== selected)
        : [...previous, selected],
    );
  }
  return (
    <section
      id="demo"
      aria-label="Interactive learning demo"
      className={styles.frame}
    >
      <div className={styles.windowBar}>
        <div className={styles.windowDots} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span>baela / your learning space</span>
        <span className={styles.demoLabel}>Interactive demo</span>
      </div>
      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <Brand className="text-lg" />
          <p className={styles.sidebarLabel}>WORKSPACE</p>
          <button
            className={view === "overview" ? styles.activeNav : styles.nav}
            onClick={() => setView("overview")}
            aria-pressed={view === "overview"}
          >
            <LayoutDashboard size={15} /> My learning
          </button>
          <button
            className={view === "lesson" ? styles.activeNav : styles.nav}
            onClick={() => setView("lesson")}
            aria-pressed={view === "lesson"}
          >
            <CirclePlay size={15} /> Lesson preview
          </button>
          <Link href="#courses" className={styles.nav}>
            <BookOpen size={15} /> Course collection
          </Link>
          <div className={styles.sidebarBottom}>
            <div className={styles.miniStar}>
              <Sparkles size={18} />
            </div>
            <p>
              Small steps.
              <br />
              Endless possibilities.
            </p>
            <span>Your next chapter starts here.</span>
          </div>
        </aside>
        <div className={styles.main}>
          <div className={styles.toolbar}>
            <span>
              Workspace <ChevronRight size={12} />{" "}
              <span>
                {view === "overview" ? "My learning" : "Lesson preview"}
              </span>
            </span>
            <Badge variant="muted" className="py-1 text-[10px]">
              Sample content
            </Badge>
          </div>
          <div className={styles.content}>
            <div className={styles.pageHeading}>
              <div>
                <p className={styles.kicker}>YOUR NEXT CHAPTER</p>
                <h3>
                  {view === "overview"
                    ? "A little progress, every day."
                    : "One lesson at a time."}
                </h3>
                <p>A space to stay curious and keep moving forward.</p>
              </div>
              <div className={styles.avatar} aria-hidden="true">
                b.
              </div>
            </div>
            <div className={styles.tabs} aria-label="Demo views">
              <button
                aria-pressed={view === "overview"}
                onClick={() => setView("overview")}
              >
                Overview
              </button>
              <button
                aria-pressed={view === "lesson"}
                onClick={() => setView("lesson")}
              >
                Lesson preview
              </button>
            </div>
            {view === "overview" ? (
              <>
                <div className={styles.courseFeature}>
                  <div className={styles.orbitArt} aria-hidden="true">
                    <div />
                    <div />
                    <div />
                    <span>
                      Expand your
                      <br />
                      horizons.
                    </span>
                  </div>
                  <div className={styles.featureContent}>
                    <p className={styles.kicker}>A TASTE OF THE EXPERIENCE</p>
                    <h4>The art of focused learning</h4>
                    <p>Make space for ideas that move you forward.</p>
                    <LearningProgress
                      value={percentage}
                      label="Demo course progress"
                      className="mt-5"
                    />
                    <Button
                      size="sm"
                      className="mt-5"
                      onClick={() =>
                        openLesson(
                          completed.length < lessons.length
                            ? lessons.findIndex(
                                (_, index) => !completed.includes(index),
                              )
                            : 0,
                        )
                      }
                    >
                      Explore a lesson <ArrowRight size={13} />
                    </Button>
                  </div>
                </div>
                <div className={styles.overviewBottom}>
                  <div className={styles.lessonList}>
                    <h4>
                      Your next steps <span>03 LESSONS</span>
                    </h4>
                    {lessons.map((item, index) => (
                      <button
                        key={item.title}
                        onClick={() => openLesson(index)}
                      >
                        <span className={styles.lessonIcon}>
                          {completed.includes(index) ? (
                            <Check size={14} />
                          ) : (
                            <CirclePlay size={14} />
                          )}
                        </span>
                        <span>
                          {item.title}
                          <small>{item.duration}</small>
                        </span>
                        <ChevronRight size={14} />
                      </button>
                    ))}
                  </div>
                  <div className={styles.progressCard}>
                    <span className={styles.progressRing}>
                      {completed.length}
                      <small>/ 3</small>
                    </span>
                    <h4>Every step counts.</h4>
                    <p>
                      {completed.length === 3
                        ? "You finished the demo. Keep that curiosity going."
                        : "Try a lesson and mark it complete to see your progress grow."}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.lessonView}>
                <article className={styles.readingCard} aria-live="polite">
                  <Badge className="text-[10px]">
                    Lesson {selected + 1} of 3 · {lesson.duration}
                  </Badge>
                  <h4>{lesson.title}</h4>
                  <p className={styles.subtitle}>{lesson.subtitle}</p>
                  <p>{lesson.body}</p>
                  <div className={styles.exercise}>
                    <Sparkles size={17} />
                    <div>
                      <h5>A small step to try</h5>
                      <p>{lesson.exercise}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={
                      completed.includes(selected) ? "outline" : "default"
                    }
                    onClick={toggleComplete}
                  >
                    <Check size={14} />
                    {completed.includes(selected)
                      ? "Completed · Undo"
                      : "Mark complete"}
                  </Button>
                </article>
                <div className={styles.lessonList}>
                  <h4>In this demo</h4>
                  {lessons.map((item, index) => (
                    <button
                      key={item.title}
                      aria-current={selected === index ? "step" : undefined}
                      onClick={() => openLesson(index)}
                    >
                      <span className={styles.lessonIcon}>
                        {completed.includes(index) ? (
                          <Check size={14} />
                        ) : (
                          <span>0{index + 1}</span>
                        )}
                      </span>
                      <span>
                        {item.title}
                        <small>{item.duration}</small>
                      </span>
                    </button>
                  ))}
                  <LearningProgress
                    value={percentage}
                    label="Demo course progress"
                    className="mt-6"
                  />
                </div>
              </div>
            )}
          </div>
          <div className={styles.statusBar}>
            <span>
              <span className={styles.statusDot} /> Preview the experience. Your
              progress here is just for this demo.
            </span>
            <button
              onClick={() => {
                setCompleted([]);
                setSelected(0);
                setView("overview");
              }}
              aria-label="Reset demo"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
