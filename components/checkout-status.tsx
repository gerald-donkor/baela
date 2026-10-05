"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
export function CheckoutStatus({ checkoutId }: { checkoutId: string }) {
  const [ready, setReady] = useState(false),
    [slow, setSlow] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let polls = 0;
    const poll = async () => {
      let confirmed = false;
      try {
        const r = await fetch(
          "/api/account?checkout_id=" + encodeURIComponent(checkoutId),
          {
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(10000),
            ]),
          },
        );
        const data = await r.json();
        confirmed = r.ok && data.ready === true;
      } catch {
        /* Pending state remains recoverable through account. */
      }
      if (controller.signal.aborted) return;
      if (confirmed) {
        setReady(true);
        return;
      }
      if (++polls >= 12) {
        setSlow(true);
        return;
      }
      timer = setTimeout(poll, Math.min(10000, 1000 * polls));
    };
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [checkoutId, attempt]);
  return (
    <div className="shell max-w-xl text-center py-24">
      <p className="eyebrow">Your next chapter</p>
      <h1 className="text-4xl font-medium mt-4">
        {ready ? "You’re ready to learn." : "Confirming your access…"}
      </h1>
      <p className="text-muted-foreground mt-5 mb-8">
        {ready
          ? "Your purchase has been confirmed and your learning library is ready."
          : slow
            ? "Confirmation is taking a little longer. You can return to your dashboard; your access will appear after payment is confirmed."
            : "We’re waiting for secure payment confirmation. This usually takes a moment."}
      </p>
      {slow && !ready && (
        <Button
          variant="outline"
          className="mr-3"
          onClick={() => {
            setSlow(false);
            setAttempt((value) => value + 1);
          }}
        >
          Check again
        </Button>
      )}
      <Button asChild>
        <Link href="/dashboard">Go to my learning</Link>
      </Button>
    </div>
  );
}
