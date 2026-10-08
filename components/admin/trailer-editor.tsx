"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LessonPlayer } from "@/components/lesson-player";
import { command } from "./client";
import { StudioPanel } from "./studio-ui";
import { Uploader, VerifyAsset, type UploadedAsset } from "./uploader";
import styles from "./studio.module.css";

type TrailerCourse = {
  id: string;
  status: string;
  trailerId: string | null;
  trailerDraftId: string | null;
};

export function TrailerEditor({
  course,
  media,
  onDirtyChange,
}: {
  course: TrailerCourse;
  media: UploadedAsset[];
  onDirtyChange: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const [selection, setSelection] = useState(course.trailerDraftId || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const busy = saving || uploading;
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const dirtySelection = useRef(false);
  const draft = media.find((asset) => asset.id === course.trailerDraftId);
  const live = media.find((asset) => asset.id === course.trailerId);
  const ready = !!draft?.ready && draft.duration > 0;
  const unsaved = selection !== (course.trailerDraftId || "");

  async function saveDraft(assetId: string | null) {
    await command({
      action: "course-trailer",
      id: course.id,
      trailerId: assetId,
    });
    setSelection(assetId || "");
    dirtySelection.current = false;
    onDirtyChange(false);
    setPreview(false);
    router.refresh();
  }
  async function run(action: () => Promise<void>, success: string) {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await action();
      setMessage(success);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save the trailer.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className={styles.editorGrid}>
      <StudioPanel>
        <div className={styles.panelHeader}>
          <h2>Course trailer</h2>
          <p className={styles.panelDescription}>
            Introduce your course with a short video. Anyone can watch the
            published trailer on your course page.
          </p>
        </div>
        <div className={styles.editorStack}>
          <label className="field-label">
            Trailer video
            <select
              className="field"
              value={selection}
              disabled={busy}
              onChange={(event) => {
                setSelection(event.target.value);
                dirtySelection.current =
                  event.target.value !== (course.trailerDraftId || "");
                onDirtyChange(dirtySelection.current);
                setPreview(false);
              }}
            >
              <option value="">Choose an uploaded video</option>
              {media
                .filter((asset) => asset.kind === "video")
                .map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                    {asset.ready && asset.duration > 0 ? "" : " (processing)"}
                  </option>
                ))}
            </select>
          </label>
          <Button
            type="button"
            variant="outline"
            disabled={busy || !selection || !unsaved}
            onClick={() =>
              void run(() => saveDraft(selection), "Trailer draft saved.")
            }
          >
            {busy ? "Saving…" : "Save trailer draft"}
          </Button>
          <Uploader
            kind="video"
            disabled={saving}
            onBusyChange={(value) => {
              setUploading(value);
              onDirtyChange(value || dirtySelection.current);
            }}
            onUpload={async (asset) => {
              setMessage("");
              setError("");
              await saveDraft(asset.id);
              setMessage(
                "Trailer draft saved. Verify processing before publishing.",
              );
            }}
          />
          {draft && (
            <div className={styles.trailerDraft}>
              <div className={styles.trailerFile}>
                <Film size={18} />
                <span>{draft.name}</span>
                <Badge variant={ready ? "success" : "muted"}>
                  {ready ? "Ready" : "Processing"}
                </Badge>
              </div>
              <VerifyAsset
                key={draft.id}
                id={draft.id}
                onReady={() => router.refresh()}
              />
              <div className={styles.trailerActions}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy || !ready || unsaved}
                  onClick={() => setPreview((value) => !value)}
                >
                  {preview ? "Close preview" : "Preview draft"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={
                    busy || !ready || unsaved || course.trailerId === draft.id
                  }
                  onClick={() =>
                    void run(async () => {
                      await command({
                        action: "publish-course-trailer",
                        id: course.id,
                        trailerId: draft.id,
                      });
                    }, "Trailer published.")
                  }
                >
                  {course.trailerId === draft.id
                    ? "Trailer is published"
                    : "Publish trailer"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    void run(() => saveDraft(null), "Trailer draft cleared.")
                  }
                >
                  Clear draft
                </Button>
              </div>
              {unsaved && (
                <p className={styles.fieldHint}>
                  Save your selected video before previewing or publishing.
                </p>
              )}
              {preview && ready && !unsaved && (
                <LessonPlayer key={draft.id} courseId={course.id} draft />
              )}
            </div>
          )}
          {message && (
            <p role="status" className="text-sm">
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </StudioPanel>
      <div className={styles.editorStack}>
        <StudioPanel>
          <h2>On your course page</h2>
          <p className={styles.panelDescription}>
            {live ? live.name : "No trailer published yet."}
          </p>
          {live ? (
            <>
              <p className={`${styles.fieldHint} mt-4`}>
                {course.status === "draft"
                  ? "Your trailer will be visible when you publish the course."
                  : "Visitors see this video before your free-preview lessons."}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await command({
                      action: "remove-course-trailer",
                      id: course.id,
                      trailerId: live.id,
                    });
                  }, "Published trailer removed.")
                }
              >
                Remove published trailer
              </Button>
            </>
          ) : (
            <p className={`${styles.fieldHint} mt-4`}>
              Your first published free-preview lesson appears here until you
              publish a trailer.
            </p>
          )}
        </StudioPanel>
        <div className={styles.notice}>
          Uploads save as drafts. Publish when you’re ready; your current
          trailer stays visible while you prepare a replacement. Trailers are
          optional and don’t count toward lesson progress.
        </div>
      </div>
    </div>
  );
}
