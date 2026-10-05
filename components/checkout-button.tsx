"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/button";
export function CheckoutButton({
  offerId,
  children,
  className,
}: {
  offerId?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });
      const body = await response.json();
      if (response.status === 401) {
        router.push(
          "/auth/sign-in?next=" +
            encodeURIComponent(location.pathname + location.hash),
        );
        return;
      }
      if (!response.ok) throw new Error(body.error);
      location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout unavailable.");
      setBusy(false);
    }
  }
  return (
    <div>
      <Button
        className={className}
        disabled={!offerId || busy}
        onClick={checkout}
      >
        {busy
          ? "Opening checkout…"
          : offerId
            ? children
            : "Enrollment opens soon"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
