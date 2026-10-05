"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CommandForm } from "./command-form";
import { command } from "./client";
import { SortableList } from "./sortable-list";
import { MarkdownEditor } from "./markdown-editor";
import { Uploader, VerifyAsset, type UploadedAsset } from "./uploader";
import { Button } from "@/components/ui/button";
type Course = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  status: string;
  coverId: string | null;
};
type Section = { id: string; title: string; position: number };
type Lesson = {
  id: string;
  sectionId: string;
  title: string;
  draftRevisionId: string | null;
  publishedRevisionId: string | null;
  position: number;
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
export function CourseEditor({
  course,
  sections,
  lessons,
  revisions,
  media,
}: {
  course: Course;
  sections: Section[];
  lessons: Lesson[];
  revisions: Revision[];
  media: UploadedAsset[];
}) {
  const router = useRouter(),
    [selected, setSelected] = useState<string | null>(null),
    [sectionId, setSectionId] = useState(sections[0]?.id || ""),
    [notice, setNotice] = useState("");
  const lesson = lessons.find((l) => l.id === selected),
    revision = revisions.find((r) => r.id === lesson?.draftRevisionId);
  async function reorder(
    kind: "sections" | "lessons",
    parentId: string,
    ids: string[],
  ) {
    try {
      await command({ action: "reorder", kind, parentId, ids });
      router.refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Reorder failed.");
    }
  }
  return (
    <div className="space-y-9">
      <section className="border rounded-2xl p-6">
        <h2 className="text-xl font-medium mb-5">Course details</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Course details and section changes appear immediately. Lesson content
          stays in draft until you publish it.
        </p>
        <CommandForm base={{ action: "course", id: course.id }}>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="field-label">
              Title
              <input
                name="title"
                defaultValue={course.title}
                className="field"
                required
              />
            </label>
            <label className="field-label">
              URL slug
              <input
                name="slug"
                defaultValue={course.slug}
                className="field"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                required
              />
            </label>
          </div>
          <label className="field-label">
            Short description
            <textarea
              name="summary"
              defaultValue={course.summary}
              className="field"
              maxLength={300}
            />
          </label>
          <label className="field-label">
            Sales description (Markdown)
            <textarea
              name="description"
              defaultValue={course.description}
              className="field"
              rows={6}
            />
          </label>
        </CommandForm>
        <div className="flex flex-wrap gap-3 mt-6">
          <CommandForm
            base={{
              action: "course-status",
              id: course.id,
              status: "published",
            }}
            label="Publish course"
          />
          <CommandForm
            base={{
              action: "course-status",
              id: course.id,
              status: "archived",
            }}
            label="Archive course"
            danger
          />
          {course.status === "draft" && (
            <CommandForm
              base={{ action: "delete-course", id: course.id }}
              label="Delete draft"
              danger
              redirectTo="/admin"
            />
          )}
        </div>
        <div className="mt-5">
          <Uploader
            kind="image"
            onUpload={async (a) => {
              await command({
                action: "course-cover",
                id: course.id,
                coverId: a.id,
              });
              router.refresh();
            }}
          />
        </div>
      </section>
      <section className="border rounded-2xl p-6">
        <h2 className="text-xl font-medium mb-4">Polar product</h2>
        <CommandForm
          base={{ action: "offer", kind: "course", courseId: course.id }}
          label="Connect / refresh product"
        >
          <label className="field-label">
            Polar product ID
            <input className="field" name="productId" required />
          </label>
        </CommandForm>
        <p className="text-sm text-muted-foreground mt-3">
          Set this course’s price in Polar, then connect its product here.
        </p>
      </section>
      <section className="grid lg:grid-cols-[300px_1fr] gap-7">
        <aside className="space-y-5">
          <h2 className="text-xl font-medium">Curriculum</h2>
          <SortableList
            items={sections}
            onReorder={(ids) => void reorder("sections", course.id, ids)}
            render={(id) => {
              const section = sections.find((s) => s.id === id)!;
              return (
                <button
                  type="button"
                  className="flex-1 text-left text-sm"
                  onClick={() => {
                    setSectionId(id);
                    setSelected(null);
                  }}
                >
                  {section.title}
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
              <input name="title" className="field" required />
            </label>
          </CommandForm>
          {sectionId && (
            <>
              <CommandForm
                key={sectionId}
                base={{ action: "section", id: sectionId, courseId: course.id }}
                label="Rename section"
              >
                <input
                  aria-label="Section title"
                  className="field"
                  name="title"
                  defaultValue={sections.find((s) => s.id === sectionId)?.title}
                  required
                />
              </CommandForm>
              <SortableList
                items={lessons.filter((l) => l.sectionId === sectionId)}
                onReorder={(ids) => void reorder("lessons", sectionId, ids)}
                render={(id) => {
                  const l = lessons.find((l) => l.id === id)!;
                  return (
                    <button
                      type="button"
                      className="flex-1 text-left text-sm"
                      onClick={() => setSelected(id)}
                    >
                      {l.title}
                      <span className="block text-xs text-muted-foreground">
                        {l.publishedRevisionId ? "Published" : "Draft"}
                      </span>
                    </button>
                  );
                }}
              />
              <Button variant="outline" onClick={() => setSelected(null)}>
                New lesson
              </Button>
              <CommandForm
                base={{ action: "delete-section", id: sectionId }}
                danger
                label="Delete draft section"
              />
            </>
          )}
          {notice && (
            <p role="alert" className="text-sm">
              {notice}
            </p>
          )}
        </aside>
        <div>
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
              onSaved={(id) => {
                setSelected(id);
                router.refresh();
              }}
            />
          ) : (
            <p className="text-muted-foreground border rounded-xl p-8">
              Add a section to start creating lessons.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
function LessonEditor({
  lesson,
  revision,
  sectionId,
  media,
  onSaved,
}: {
  lesson?: Lesson;
  revision?: Revision;
  sectionId: string;
  media: UploadedAsset[];
  onSaved: (id: string) => void;
}) {
  const [title, setTitle] = useState(revision?.title || lesson?.title || ""),
    [markdown, setMarkdown] = useState(revision?.markdown || ""),
    [videoId, setVideoId] = useState(revision?.videoId || ""),
    [preview, setPreview] = useState(revision?.preview || false),
    [attachments, setAttachments] = useState(revision?.attachmentIds || []),
    [assets, setAssets] = useState(media),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
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
      onSaved(data.id);
      setMessage("Draft saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="border rounded-2xl p-6">
      <h2 className="text-xl font-medium mb-5">
        {lesson ? "Edit lesson" : "New lesson"}
      </h2>
      <form onSubmit={save} className="space-y-5">
        <label className="field-label">
          Lesson title
          <input
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
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
            <MarkdownEditor value={markdown} onChange={setMarkdown} />
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
                  onClick={() =>
                    setAttachments((s) => s.filter((x) => x !== id))
                  }
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
            }}
          />
        </div>
        <Button disabled={busy}>{busy ? "Saving…" : "Save draft"}</Button>
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
            label="Publish saved draft"
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
