"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="en">
      <body>
        <main style={{ padding: 40, fontFamily: "sans-serif" }}>
          <h1>Baela is temporarily unavailable.</h1>
          <p>Please try again in a moment.</p>
          <button onClick={reset}>Try again</button>
        </main>
      </body>
    </html>
  );
}
