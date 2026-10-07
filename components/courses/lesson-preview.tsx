import {
  FileCode2,
  Folder,
  Maximize,
  Play,
  Settings2,
  Volume2,
} from "lucide-react";
import type { SampleCourse, SampleLesson } from "@/lib/sample-courses";
import styles from "./course-ui.module.css";

function CodeLine({ line }: { line: string }) {
  const parts = line.split(
    /('(?:[^']*)'|"(?:[^"]*)"|\b(?:import|from|export|async|await|const|return|if|type|interface|function|number|string|void)\b|\/\/.*)/g,
  );
  return (
    <>
      {parts.map((part, i) => (
        <span
          key={i}
          className={
            /^["']/.test(part)
              ? styles.codeString
              : /^(import|from|export|async|await|const|return|if|type|interface|function|number|string|void)$/.test(
                    part,
                  )
                ? styles.codeKeyword
                : undefined
          }
        >
          {part}
        </span>
      ))}
    </>
  );
}

export function LessonPreview({
  course,
  lesson,
}: {
  course: SampleCourse;
  lesson: SampleLesson;
}) {
  return (
    <div
      className={styles.player}
      aria-label={`Sample video preview: ${lesson.title}`}
    >
      <div className={styles.editor} aria-hidden="true">
        <div className={styles.editorBar}>
          <span>
            <i />
            <i />
            <i />
          </span>
          <span>baela / {course.shortTitle.toLowerCase()}</span>
          <span>Editor preview</span>
        </div>
        <div className={styles.editorBody}>
          <div className={styles.fileTree}>
            <p>Project files</p>
            <span>
              <Folder size={12} />{" "}
              {course.art === "design" ? "Learning app" : "workspace"}
            </span>
            <span className={styles.treeIndent}>
              <Folder size={12} /> {course.art === "design" ? "Screens" : "src"}
            </span>
            <span className={styles.treeIndent}>
              <Folder size={12} /> components
            </span>
            <span className={styles.treeIndent}>
              <Folder size={12} /> lib
            </span>
            <span className={styles.fileSelected}>
              <FileCode2 size={12} /> {course.filename}
            </span>
            <span className={styles.treeIndent}>
              <FileCode2 size={12} /> index.ts
            </span>
            <span className={styles.treeIndent}>
              <FileCode2 size={12} /> styles.css
            </span>
            <span>
              <FileCode2 size={12} /> package.json
            </span>
          </div>
          {course.art === "design" ? (
            <div className={styles.designCanvas}>
              <div className={styles.designSwatches}>
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className={styles.designBoard}>
                <span>My learning space</span>
                <strong>
                  A little progress,
                  <br />
                  every day.
                </strong>
                <p>Make room for your next chapter.</p>
                <div>
                  <i />
                  <i />
                  <i />
                </div>
                <b>Continue learning</b>
              </div>
              <span className={styles.canvasLabel}>
                Desktop / Course library
              </span>
            </div>
          ) : (
            <div className={styles.codePanel}>
              <div className={styles.fileTab}>
                <FileCode2 size={13} /> {course.filename}
                <span>×</span>
              </div>
              <div className={styles.codeLines}>
                {course.code.map((line, i) => (
                  <div key={i}>
                    <span className={styles.lineNumber}>{i + 1}</span>
                    <code>
                      <CodeLine line={line} />
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={styles.playOverlay}>
        <span className={styles.playCircle}>
          <Play size={24} fill="currentColor" />
        </span>
        <span>Lesson preview</span>
      </div>
      <div className={styles.videoControls} aria-hidden="true">
        <div className={styles.videoTrack}>
          <span />
        </div>
        <div>
          <Play size={13} fill="currentColor" />
          <span>
            00:00 <i>/ {lesson.duration}</i>
          </span>
          <span className={styles.controlsEnd}>
            <Volume2 size={14} />
            <span>1×</span>
            <Settings2 size={14} />
            <Maximize size={14} />
          </span>
        </div>
      </div>
      <span className="sr-only">
        Static sample preview. Video playback is not connected.
      </span>
    </div>
  );
}
