"use client";
import { useState } from "react";
import { Dialog } from "radix-ui";
import { Plus, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandForm } from "./command-form";
import styles from "./studio.module.css";

export function NewCourseDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) {
          setTitle("");
          setSlug("");
          setSlugEdited(false);
        }
      }}
    >
      <Dialog.Trigger asChild>
        <Button>
          <Plus size={17} />
          New course
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.dialogOverlay} />
        <Dialog.Content className={styles.dialog}>
          <span className={styles.emptyIcon}>
            <BookOpen size={23} />
          </span>
          <Dialog.Title className={styles.dialogTitle}>
            Make room for a new course.
          </Dialog.Title>
          <Dialog.Description className={styles.dialogDescription}>
            Start with a title. Add your lessons and media when you’re ready.
            Your course stays private until you publish it.
          </Dialog.Description>
          <CommandForm
            base={{ action: "course", summary: "", description: "" }}
            label="Create draft"
            redirectTo="/admin/courses/{id}"
            onSuccess={() => setOpen(false)}
          >
            <label className="field-label">
              Course title
              <input
                className="field"
                name="title"
                value={title}
                maxLength={180}
                placeholder="What will you teach?"
                required
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugEdited)
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .normalize("NFKD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "")
                        .slice(0, 100)
                        .replace(/-$/, ""),
                    );
                }}
              />
            </label>
            <label className="field-label">
              Course URL
              <input
                className="field"
                name="slug"
                value={slug}
                maxLength={100}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder="your-course-name"
                required
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(e.target.value);
                }}
              />
              <span className={styles.fieldHint}>
                /courses/{slug || "your-course-name"}
              </span>
            </label>
          </CommandForm>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className={styles.dialogClose}
              aria-label="Close new course"
            >
              <X size={19} />
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
