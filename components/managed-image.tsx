"use client";
import { useEffect, useState } from "react";
export function ManagedImage({
  assetId,
  alt,
  lessonId,
  draft = false,
  editor = false,
}: {
  assetId: string;
  alt: string;
  lessonId?: string;
  draft?: boolean;
  editor?: boolean;
}) {
  const [url, setUrl] = useState(""),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch(
          editor ? "/api/admin/uploads" : "/api/media/sign",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              editor
                ? { action: "preview", id: assetId }
                : { lessonId, assetId, draft },
            ),
            signal: controller.signal,
          },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Image unavailable.");
        if (!controller.signal.aborted) {
          setUrl(data.url);
          setError("");
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error ? error.message : "Image unavailable.",
          );
      }
    }
    void refresh();
    const timer = setInterval(refresh, 240000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [assetId, lessonId, draft, editor, attempt]);
  if (error)
    return (
      <span role="status">
        {error}{" "}
        <button
          type="button"
          className="underline"
          onClick={() => setAttempt((n) => n + 1)}
        >
          Retry image
        </button>
      </span>
    );
  // Provider-signed private URLs must not pass through a shared image optimizer.
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className="rounded-lg max-w-full h-auto"
      onError={() => setError("Image could not load.")}
    />
  ) : (
    <span role="status">Loading {alt || "lesson image"}…</span>
  );
}
