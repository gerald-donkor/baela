"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
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
    <div className="shell py-24 text-center">
      <h1 className="text-3xl font-medium">Let’s try that again.</h1>
      <p className="text-muted-foreground my-5">
        Something interrupted this page. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
