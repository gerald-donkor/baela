"use client";
import { useEffect, useRef, useState } from "react";
import type {
  LoaderContext,
  LoaderConfiguration,
  LoaderCallbacks,
} from "hls.js";
import { Button } from "./ui/button";
import { mergeIntervals, type Interval } from "@/lib/domain/progress";
async function post(url: string, body: unknown) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Playback unavailable.");
  return data;
}
export function LessonPlayer({
  lessonId,
  position = 0,
  completed = false,
  signedIn = false,
  draft = false,
}: {
  lessonId: string;
  position?: number;
  completed?: boolean;
  signedIn?: boolean;
  draft?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null),
    session = useRef(""),
    sequence = useRef(0),
    intervals = useRef<Interval[]>([]),
    last = useRef<number | null>(null);
  const [error, setError] = useState(""),
    [done, setDone] = useState(completed),
    [attempt, setAttempt] = useState(0),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    session.current = "";
    intervals.current = [];
    last.current = null;
    sequence.current = 0;
    const element = video.current!;
    let stopped = false,
      destroy: undefined | (() => void),
      refresh: ReturnType<typeof setInterval> | undefined;
    async function save(complete?: boolean) {
      if (!session.current) return;
      try {
        const result = await post("/api/progress", {
          lessonId,
          sessionId: session.current,
          sequence: sequence.current++,
          position: element.currentTime,
          intervals: intervals.current,
          complete,
        });
        if (!stopped && typeof result.completed === "boolean")
          setDone(result.completed);
      } catch (e) {
        if (!stopped)
          setError(
            e instanceof Error ? e.message : "Progress could not be saved.",
          );
      }
    }
    const watch = () => {
      if (!element.paused && !element.seeking) {
        const at = element.currentTime;
        if (
          last.current !== null &&
          at >= last.current &&
          at - last.current < 5
        )
          intervals.current = mergeIntervals(
            [...intervals.current, [last.current, at]],
            element.duration,
          );
        last.current = at;
      } else last.current = null;
    };
    const pause = () => {
      last.current = null;
      void save();
    };
    const seeking = () => {
      last.current = null;
    };
    const failed = () => {
      if (!stopped) setError("Playback could not load. Please try again.");
    };
    element.addEventListener("error", failed);
    const ready = () => {
      if (position > 0 && position < element.duration)
        element.currentTime = position;
    };
    element.addEventListener("timeupdate", watch);
    element.addEventListener("pause", pause);
    element.addEventListener("seeking", seeking);
    element.addEventListener("loadedmetadata", ready, { once: true });
    async function start() {
      try {
        if (signedIn) {
          const data = await post("/api/progress", { lessonId });
          if (stopped) return;
          session.current = data.sessionId;
        }
        const { default: Hls } = await import("hls.js");
        if (stopped) return;
        const source = await post("/api/media/sign", {
          lessonId,
          draft,
          hls: Hls.isSupported(),
        });
        if (stopped) return;
        if (Hls.isSupported() && source.hls) {
          class SignedLoader extends Hls.DefaultConfig.loader {
            private canceled = false;
            abort() {
              this.canceled = true;
              super.abort();
            }
            destroy() {
              this.canceled = true;
              super.destroy();
            }
            load(
              context: LoaderContext,
              config: LoaderConfiguration,
              callbacks: LoaderCallbacks<LoaderContext>,
            ) {
              this.canceled = false;
              post("/api/media/sign", { lessonId, draft, url: context.url })
                .then(({ url }) => {
                  if (!stopped && !this.canceled)
                    super.load({ ...context, url }, config, callbacks);
                })
                .catch((e) => {
                  if (stopped || this.canceled) return;
                  callbacks.onError(
                    { code: 403, text: e.message },
                    context,
                    null,
                    this.stats,
                  );
                });
            }
          }
          const hls = new Hls({ loader: SignedLoader, maxBufferLength: 30 });
          destroy = () => hls.destroy();
          hls.loadSource(source.url);
          hls.attachMedia(element);
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal && !stopped)
              setError(
                "Playback was interrupted. Check your connection or try again.",
              );
          });
        } else {
          const renew = async () => {
            const at = element.currentTime,
              playing = !element.paused;
            const source = await post("/api/media/sign", { lessonId, draft });
            if (stopped) return;
            element.src = source.url;
            element.addEventListener(
              "loadedmetadata",
              () => {
                element.currentTime = at || position;
                if (playing) void element.play();
              },
              { once: true },
            );
          };
          await renew();
          refresh = setInterval(() => {
            void renew().catch((e) => setError(e.message));
          }, 240000);
        }
      } catch (e) {
        if (!stopped)
          setError(
            e instanceof Error ? e.message : "Could not load this lesson.",
          );
      }
    }
    void start();
    const timer = setInterval(() => void save(), 15000);
    const hide = () => {
      if (document.visibilityState === "hidden") void save();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      void save();
      stopped = true;
      clearInterval(timer);
      if (refresh) clearInterval(refresh);
      destroy?.();
      element.removeEventListener("error", failed);
      element.removeEventListener("timeupdate", watch);
      element.removeEventListener("pause", pause);
      element.removeEventListener("seeking", seeking);
      element.removeEventListener("loadedmetadata", ready);
      document.removeEventListener("visibilitychange", hide);
      session.current = "";
    };
  }, [lessonId, position, signedIn, attempt, completed, draft]);
  async function mark() {
    if (!session.current) return;
    setSaving(true);
    try {
      const data = await post("/api/progress", {
        lessonId,
        sessionId: session.current,
        sequence: sequence.current++,
        position: video.current?.currentTime || 0,
        intervals: intervals.current,
        complete: !done,
      });
      setDone(data.completed);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div>
      <video
        ref={video}
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload"
        aria-label="Lesson video"
        className="aspect-video w-full rounded-2xl bg-black"
      />
      {error && (
        <div
          role="alert"
          className="mt-3 p-4 rounded-xl bg-secondary text-sm flex items-center justify-between gap-3"
        >
          {error}
          <Button
            size="sm"
            onClick={() => {
              setError("");
              setAttempt((a) => a + 1);
            }}
          >
            Try again
          </Button>
        </div>
      )}
      <div className="flex justify-between items-center gap-4 mt-5">
        <p className="text-xs text-muted-foreground">
          {signedIn
            ? "Your progress saves as you watch."
            : "Sign in to save your progress."}
        </p>
        {signedIn && (
          <Button
            variant={done ? "secondary" : "outline"}
            disabled={saving}
            onClick={mark}
          >
            {done ? "Completed · Undo" : "Mark complete"}
          </Button>
        )}
      </div>
    </div>
  );
}
export function DownloadAttachment({
  lessonId,
  assetId,
  name,
}: {
  lessonId: string;
  assetId: string;
  name: string;
}) {
  const [error, setError] = useState("");
  async function download() {
    try {
      const data = await post("/api/media/sign", { lessonId, assetId });
      window.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download unavailable.");
    }
  }
  return (
    <div>
      <Button variant="outline" onClick={download}>
        {name} ↓
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
