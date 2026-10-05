"use client";
import Link from "next/link";
import { useState } from "react";
import { Dialog } from "radix-ui";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { Button } from "./ui/button";
export type CurriculumEntry = {
  id: string;
  title: string;
  section: string;
  href: string;
  locked: boolean;
  completed: boolean;
};
export function LessonCurriculum({
  entries,
  current,
}: {
  entries: CurriculumEntry[];
  current: string;
}) {
  const [open, setOpen] = useState(false);
  const list = (
    <nav aria-label="Course lessons" className="space-y-1 mt-5">
      {entries.map((entry) => (
        <Link
          key={entry.id}
          href={entry.href}
          onClick={() => setOpen(false)}
          aria-current={entry.id === current ? "page" : undefined}
          className={
            "block p-3 rounded-lg text-sm " +
            (entry.id === current
              ? "bg-secondary text-primary font-medium"
              : "text-muted-foreground hover:bg-secondary")
          }
        >
          <span className="text-xs block opacity-70 mb-1">{entry.section}</span>
          <span className="flex gap-2 items-center">
            {entry.locked ? (
              <LockKeyhole className="size-4 shrink-0" aria-label="Locked" />
            ) : entry.completed ? (
              <CheckCircle2
                className="size-4 shrink-0"
                aria-label="Completed"
              />
            ) : null}
            {entry.title}
          </span>
        </Link>
      ))}
    </nav>
  );
  return (
    <>
      <aside className="hidden lg:block">
        <div className="rounded-2xl border p-5 sticky top-8">
          <h2 className="font-medium">Course curriculum</h2>
          {list}
        </div>
      </aside>
      <div className="lg:hidden fixed bottom-5 right-5 z-30">
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <Button>Course curriculum</Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
            <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-[min(90vw,24rem)] bg-background p-6 overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <Dialog.Title className="font-medium text-xl">
                  Course curriculum
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button variant="ghost" aria-label="Close curriculum">
                    ✕
                  </Button>
                </Dialog.Close>
              </div>
              <Dialog.Description className="text-sm text-muted-foreground mt-2">
                Choose any lesson to continue learning.
              </Dialog.Description>
              {list}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}
