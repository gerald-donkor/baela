"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  FileText,
  Film,
  ListVideo,
  Rocket,
} from "lucide-react";
import { CommandForm } from "./command-form";
import { command } from "./client";
import { SortableList } from "./sortable-list";
import { MarkdownEditor } from "./markdown-editor";
import { Uploader, VerifyAsset, type UploadedAsset } from "./uploader";
import { Button } from "@/components/ui/button";
import { ManagedImage } from "@/components/managed-image";
import { StudioHeading, StudioPanel, CourseStatus } from "./studio-ui";
import { TrailerEditor } from "./trailer-editor";
import styles from "./studio.module.css";

type Course = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  status: string;
  coverId: string | null;
  trailerId: string | null;
  trailerDraftId: string | null;
  everPublished: boolean;
};
type Section = { id: string; title: string; position: number };
type Lesson = {
  id: string;
  sectionId: string;
  title: string;
  draftRevisionId: string | null;
  publishedRevisionId: string | null;
  position: number;
  retiredAt: Date | null;
};
type Revision = {
  id: string;
  lessonId: string;
  title: string;
  markdown: string;
  videoId: string | null;
  preview: boolean;
  attachmentIds: string[];
};
type Offer = {
  productId: string;
  amount: number;
  active: boolean;
  currency: string;
};

export function CourseEditor({
  course,
  sections,
  lessons,
  revisions,
  media,
  offer,
}: {
  course: Course;
  sections: Section[];
  lessons: Lesson[];
  revisions: Revision[];
  media: UploadedAsset[];
  offer: Offer | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("details");
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedSection, setSectionId] = useState(sections[0]?.id || "");
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);
  const sectionId = sections.some((s) => s.id === selectedSection)
    ? selectedSection
    : sections[0]?.id || "";
  const lesson = lessons.find((l) => l.id === selected);
  const revision = revisions.find((r) => r.id === lesson?.draftRevisionId);
  const published = lessons.filter(
    (l) => l.publishedRevisionId && !l.retiredAt,
  ).length;
  function navigate(action: () => void) {
    if (
      dirty &&
      !confirm("You have unsaved changes. Discard them and continue?")
    )
      return;
    setDirty(false);
    action();
  }
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function reorder(
    kind: "sections" | "lessons",
    parentId: string,
    ids: string[],
  ) {
    try {
      await command({ action: "reorder", kind, parentId, ids });
      setNotice("Order saved.");
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Reorder failed.");
    }
  }
  const tabs = [
    { id: "details", label: "Course details", icon: FileText },
    { id: "trailer", label: "Trailer", icon: Film },
    { id: "curriculum", label: "Curriculum", icon: ListVideo },
    { id: "publish", label: "Publishing", icon: Rocket },
  ];
  return (
    <>
      <Link
        href="/admin"
        className={styles.backLink}
        onClick={(event) => {
          if (
            dirty &&
            !confirm("Discard unsaved changes and return to courses?")
          )
            event.preventDefault();
        }}
      >
        <ArrowLeft size={14} />
        All courses
      </Link>
      <StudioHeading
        title={course.title}
        description={`${sections.length} sections · ${lessons.filter((l) => !l.retiredAt).length} lessons · ${published} published`}
        action={<CourseStatus status={course.status} />}
      />
      <div
        role="tablist"
        aria-label="Course workspace"
        className={styles.editorTabs}
      >
        {tabs.map(({ id, label, icon: Icon }, index) => (
          <button
            type="button"
            role="tab"
            id={`course-tab-${id}`}
            aria-controls={`course-panel-${id}`}
            aria-selected={tab === id}
            tabIndex={tab === id ? 0 : -1}
            className={styles.editorTab}
            key={id}
            onClick={() => navigate(() => setTab(id))}
            onKeyDown={(event) => {
              if (
                ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              ) {
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? tabs.length - 1
                      : (index +
                          (event.key === "ArrowRight" ? 1 : -1) +
                          tabs.length) %
                        tabs.length;
                navigate(() => {
                  setTab(tabs[next].id);
                  document
                    .getElementById(`course-tab-${tabs[next].id}`)
                    ?.focus();
                });
              }
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`course-panel-${tab}`}
        aria-labelledby={`course-tab-${tab}`}
      >
        {tab === "trailer" && (
          <TrailerEditor
            course={course}
            media={media}
            onDirtyChange={setDirty}
          />
        )}
        {tab === "details" && (
          <div className={styles.editorGrid}>
            <StudioPanel>
              <div className={styles.panelHeader}>
                <h2>Introduce your course</h2>
                <p className={styles.panelDescription}>
                  Help students understand what they’ll learn. Saved course
                  details appear immediately.
                </p>
              </div>
              <div onChange={() => setDirty(true)}>
                <CommandForm
                  base={{ action: "course", id: course.id }}
                  onSuccess={() => setDirty(false)}
                >
                  <label className="field-label">
                    Course title
                    <input
                      name="title"
                      defaultValue={course.title}
                      className="field"
                      maxLength={180}
                      required
                    />
                  </label>
                  <label className="field-label">
                    Course URL
                    <input
                      name="slug"
                      defaultValue={course.slug}
                      className="field"
                      maxLength={100}
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                      required
                    />
                    <span className={styles.fieldHint}>
                      /courses/{course.slug}
                    </span>
                  </label>
                  <label className="field-label">
                    Short description
                    <textarea
                      name="summary"
                      defaultValue={course.summary}
                      className="field"
                      maxLength={300}
                      rows={3}
                      placeholder="What will students take away?"
                    />
                    <span className={styles.fieldHint}>
                      Up to 300 characters. Shown in your course collection.
                    </span>
                  </label>
                  <label className="field-label">
                    Full description (Markdown)
                    <textarea
                      name="description"
                      defaultValue={course.description}
                      className="field"
                      maxLength={20000}
                      rows={9}
                      placeholder="Describe what’s inside, who it’s for, and what students will learn."
                    />
                  </label>
                </CommandForm>
              </div>
            </StudioPanel>
            <div className={styles.editorStack}>
              <StudioPanel>
                <h2>Course cover</h2>
                <p className={styles.panelDescription}>
                  A first glimpse of what’s inside.
                </p>
                <div className={styles.coverPreview}>
                  {course.coverId ? (
                    <ManagedImage
                      assetId={course.coverId}
                      alt="Course cover"
                      editor
                    />
                  ) : (
                    <BookOpen size={38} strokeWidth={1.2} />
                  )}
                </div>
                <Uploader
                  kind="image"
                  onUpload={async (asset) => {
                    await command({
                      action: "course-cover",
                      id: course.id,
                      coverId: asset.id,
                    });
                    router.refresh();
                  }}
                />
                {course.coverId && (
                  <div className="mt-4">
                    <CommandForm
                      base={{
                        action: "course-cover",
                        id: course.id,
                        coverId: null,
                      }}
                      label="Remove cover"
                      variant="outline"
                    />
                  </div>
                )}
                <p className={styles.panelDescription}>
                  Use a landscape image. JPEG, PNG, or WebP.
                </p>
              </StudioPanel>
              <div className={styles.notice}>
                Course and section changes appear immediately. Lesson content
                stays in draft until you publish each lesson.
              </div>
            </div>
          </div>
        )}
        {tab === "curriculum" && (
          <section className={styles.curriculumGrid}>
            <aside className={`${styles.panel} ${styles.curriculum}`}>
              <h2>Curriculum</h2>
              <p className={styles.curriculumHint}>
                Drag the handles to reorder. With a keyboard, press Space on a
                handle, use the arrow keys, then Space to save.
              </p>
              <SortableList
                items={sections}
                onReorder={(ids) => void reorder("sections", course.id, ids)}
                render={(id) => {
                  const section = sections.find((s) => s.id === id)!;
                  return (
                    <button
                      type="button"
                      className={styles.curriculumButton}
                      aria-pressed={sectionId === id}
                      onClick={() =>
                        navigate(() => {
                          setSectionId(id);
                          setSelected(null);
                        })
                      }
                    >
                      {section.title}
                      <small>
                        {
                          lessons.filter(
                            (l) => l.sectionId === id && !l.retiredAt,
                          ).length
                        }{" "}
                        lessons
                      </small>
                    </button>
                  );
                }}
              />
              <CommandForm
                base={{ action: "section", courseId: course.id }}
                label="Add section"
              >
                <label className="field-label">
                  New section
                  <input
                    name="title"
                    className="field"
                    required
                    maxLength={180}
                    placeholder="Section title"
                  />
                </label>
              </CommandForm>
              {sectionId && (
                <div className="space-y-5 border-t pt-5">
                  <CommandForm
                    key={sectionId}
                    base={{
                      action: "section",
                      id: sectionId,
                      courseId: course.id,
                    }}
                    label="Rename section"
                    variant="outline"
                  >
                    <label className="field-label">
                      Selected section
                      <input
                        className="field"
                        name="title"
                        defaultValue={
                          sections.find((s) => s.id === sectionId)?.title
                        }
                        maxLength={180}
                        required
                      />
                    </label>
                  </CommandForm>
                  <SortableList
                    items={lessons.filter((l) => l.sectionId === sectionId)}
                    onReorder={(ids) => void reorder("lessons", sectionId, ids)}
                    render={(id) => {
                      const item = lessons.find((l) => l.id === id)!;
                      return (
                        <button
                          type="button"
                          className={styles.curriculumButton}
                          aria-pressed={selected === id}
                          onClick={() => navigate(() => setSelected(id))}
                        >
                          {item.title}
                          <small>
                            {item.retiredAt
                              ? "Retired"
                              : item.publishedRevisionId
                                ? item.draftRevisionId !==
                                  item.publishedRevisionId
                                  ? "Published · draft changes"
                                  : "Published"
                                : "Draft"}
                          </small>
                        </button>
                      );
                    }}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(() => setSelected(null))}
                  >
                    New lesson
                  </Button>
                  <CommandForm
                    base={{ action: "delete-section", id: sectionId }}
                    danger
                    label="Delete draft section"
                  />
                </div>
              )}
              {notice && (
                <p role="status" className="text-xs text-muted-foreground">
                  {notice}
                </p>
              )}
            </aside>
            <div className="min-w-0">
              {sectionId ? (
                <LessonEditor
                  key={
                    (selected || "new") +
                    ":" +
                    sectionId +
                    ":" +
                    (revision?.id || "")
                  }
                  lesson={lesson}
                  revision={revision}
                  sectionId={sectionId}
                  media={media}
                  onDirtyChange={setDirty}
                  onSaved={(id) => {
                    setDirty(false);
                    setSelected(id);
                    router.refresh();
                  }}
                />
              ) : (
                <StudioPanel>
                  <div className={styles.empty}>
                    <span className={styles.emptyIcon}>
                      <ListVideo size={26} />
                    </span>
                    <h3>Give your course a little structure.</h3>
                    <p>
                      Add your first section, then fill it with lessons, videos,
                      and resources.
                    </p>
                  </div>
                </StudioPanel>
              )}
            </div>
          </section>
        )}
        {tab === "publish" && (
          <div className={styles.editorGrid}>
            <div className={styles.editorStack}>
              <StudioPanel>
                <h2>Ready for your students?</h2>
                <p className={styles.panelDescription}>
                  Publish your lessons first, then make your course available.
                </p>
                <ul className={styles.checklist}>
                  {[
                    {
                      complete: !!course.summary,
                      title: "Introduce your course",
                      detail:
                        "Add a short description to help students choose.",
                    },
                    {
                      complete: !!course.coverId,
                      title: "Add a course cover",
                      detail:
                        "A cover helps your course stand out. Optional for publishing.",
                    },
                    {
                      complete: published > 0,
                      title: "Publish at least one lesson",
                      detail: `${published} published. Each lesson needs a verified video.`,
                    },
                    {
                      complete: !!offer?.active,
                      title: "Connect your course price",
                      detail: offer?.active
                        ? `${new Intl.NumberFormat("en-US", { style: "currency", currency: offer.currency }).format(offer.amount / 100)} one-time purchase`
                        : "Create a course product in Polar and connect it below.",
                    },
                  ].map(({ complete, title, detail }) => (
                    <li
                      className={styles.check}
                      data-complete={complete}
                      key={title}
                    >
                      {complete ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <Circle size={18} />
                      )}
                      <span>
                        {title}
                        <small>{detail}</small>
                      </span>
                    </li>
                  ))}
                </ul>
                <CommandForm
                  base={{
                    action: "course-status",
                    id: course.id,
                    status: "published",
                  }}
                  label={
                    course.status === "published"
                      ? "Course is published"
                      : course.status === "archived"
                        ? "Republish course"
                        : "Publish course"
                  }
                  disabled={
                    course.status === "published" ||
                    published === 0 ||
                    !offer?.active
                  }
                />
                <p className={styles.panelDescription}>
                  Publishing makes the course available in your public catalog.
                  Saved lesson drafts still need to be published separately.
                </p>
                {course.status === "published" && (
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link href={`/courses/${course.slug}`}>
                      View course page
                    </Link>
                  </Button>
                )}
              </StudioPanel>
              <StudioPanel>
                <h2>Course price</h2>
                <p className={styles.panelDescription}>
                  Set the price in Polar, then connect its product here. Refresh
                  after changing the price in Polar.
                </p>
                <div className="mt-5">
                  <CommandForm
                    base={{
                      action: "offer",
                      kind: "course",
                      courseId: course.id,
                    }}
                    label={offer ? "Refresh product" : "Connect product"}
                  >
                    <label className="field-label">
                      Polar product ID
                      <input
                        className="field"
                        name="productId"
                        defaultValue={offer?.productId}
                        required
                      />
                    </label>
                  </CommandForm>
                </div>
              </StudioPanel>
            </div>
            <StudioPanel>
              <h2>Course lifecycle</h2>
              <p className={styles.panelDescription}>
                Archived courses leave the public catalog. Students with access
                can keep learning.
              </p>
              <div className="mt-5 space-y-5">
                {course.status !== "archived" &&
                  (course.everPublished || course.status === "published") && (
                    <CommandForm
                      base={{
                        action: "course-status",
                        id: course.id,
                        status: "archived",
                      }}
                      label="Archive course"
                      danger
                    />
                  )}
                {course.status === "draft" && !course.everPublished && (
                  <>
                    <p className={styles.panelDescription}>
                      You can permanently delete a draft that has never been
                      published or sold.
                    </p>
                    <CommandForm
                      base={{ action: "delete-course", id: course.id }}
                      label="Delete draft"
                      danger
                      redirectTo="/admin"
                    />
                  </>
                )}
              </div>
            </StudioPanel>
          </div>
        )}
      </div>
    </>
  );
}
function LessonEditor({
  lesson,
  revision,
  sectionId,
  media,
  onSaved,
  onDirtyChange,
}: {
  lesson?: Lesson;
  revision?: Revision;
  sectionId: string;
  media: UploadedAsset[];
  onSaved: (id: string) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [title, setTitle] = useState(revision?.title || lesson?.title || ""),
    [markdown, setMarkdown] = useState(revision?.markdown || ""),
    [videoId, setVideoId] = useState(revision?.videoId || ""),
    [preview, setPreview] = useState(revision?.preview || false),
    [attachments, setAttachments] = useState(revision?.attachmentIds || []),
    [assets, setAssets] = useState(media),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [dirty, setDirty] = useState(false);
  function changed() {
    setDirty(true);
    onDirtyChange(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const data = await command({
        action: "lesson",
        id: lesson?.id,
        sectionId,
        title,
        markdown,
        videoId: videoId || null,
        preview,
        attachmentIds: attachments,
      });
      setDirty(false);
      onDirtyChange(false);
      onSaved(data.id);
      setMessage("Draft saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.panel}>
      <h2 className="text-xl font-medium mb-5">
        {lesson ? "Edit lesson" : "New lesson"}
      </h2>
      <p className="text-xs text-muted-foreground mb-5">
        Save your work as a draft, preview it, then publish when you’re ready.
      </p>
      <form onSubmit={save} className="space-y-5" onChange={changed}>
        <label className="field-label">
          Lesson title
          <input
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={180}
          />
        </label>
        <label className="field-label">
          Video
          <select
            className="field"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
          >
            <option value="">Choose a video</option>
            {assets
              .filter((a) => a.kind === "video")
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} {a.ready ? "✓" : "(processing)"}
                </option>
              ))}
          </select>
        </label>
        <Uploader
          kind="video"
          onUpload={(a) => {
            setAssets((s) => [a, ...s]);
            setVideoId(a.id);
            changed();
          }}
        />
        {videoId && (
          <VerifyAsset
            id={videoId}
            onReady={() =>
              setAssets((s) =>
                s.map((a) => (a.id === videoId ? { ...a, ready: true } : a)),
              )
            }
          />
        )}
        <div>
          <label>Written lesson</label>
          <div className="mt-2">
            <MarkdownEditor
              value={markdown}
              onChange={(value) => {
                setMarkdown(value);
                changed();
              }}
            />
          </div>
        </div>
        <label className="flex gap-3 items-center">
          <input
            type="checkbox"
            checked={preview}
            onChange={(e) => setPreview(e.target.checked)}
          />
          Free preview: video, text, and attachments
        </label>
        <div>
          <h3 className="font-medium mb-3">Attachments</h3>
          <div className="space-y-2 mb-4">
            {attachments.map((id) => (
              <div key={id} className="flex gap-3 items-center text-sm">
                <span className="flex-1">
                  {assets.find((a) => a.id === id)?.name || "Attachment"}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAttachments((s) => s.filter((x) => x !== id));
                    changed();
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <Uploader
            kind="attachment"
            onUpload={(a) => {
              setAssets((s) => [a, ...s]);
              setAttachments((s) => [...s, a.id]);
              changed();
            }}
          />
        </div>
        <Button disabled={busy}>{busy ? "Saving…" : "Save draft"}</Button>
        {dirty && (
          <p className="text-xs text-muted-foreground">
            Unsaved changes. Save the draft before publishing or previewing it.
          </p>
        )}
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
      </form>
      {lesson && (
        <div className="mt-6 pt-5 border-t flex flex-wrap gap-3">
          <CommandForm
            base={{ action: "publish-lesson", id: lesson.id }}
            label={
              lesson.retiredAt ? "Restore saved draft" : "Publish saved draft"
            }
            disabled={dirty || busy || !revision?.videoId}
          />
          <Button asChild variant="outline" size="sm">
            <Link href={"/admin/preview/" + lesson.id}>Preview draft</Link>
          </Button>
          <CommandForm
            base={{ action: "retire-lesson", id: lesson.id }}
            label={
              lesson.publishedRevisionId
                ? "Retire lesson"
                : "Delete draft lesson"
            }
            danger
          />
        </div>
      )}
    </div>
  );
}
