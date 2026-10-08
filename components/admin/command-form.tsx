"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { command } from "./client";
import { Button } from "@/components/ui/button";
import { RequiredFieldsNote } from "./required-field";
export function CommandForm({
  base,
  children,
  label = "Save changes",
  danger = false,
  redirectTo,
  onSuccess,
  disabled = false,
  variant,
}: {
  base: Record<string, unknown>;
  children?: React.ReactNode;
  label?: string;
  danger?: boolean;
  redirectTo?: string;
  onSuccess?: () => void;
  disabled?: boolean;
  variant?: "default" | "outline" | "secondary";
}) {
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (danger && !confirm("This action changes or removes content. Continue?"))
      return;
    setBusy(true);
    setMessage("");
    try {
      const values = Object.fromEntries(new FormData(e.currentTarget));
      const result = await command({ ...base, ...values });
      setMessage("Saved.");
      onSuccess?.();
      if (redirectTo) router.push(redirectTo.replace("{id}", result.id));
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {children && <RequiredFieldsNote />}
      {children}
      <div className="flex flex-wrap items-center gap-4">
        <Button
          disabled={busy || disabled}
          variant={danger ? "destructive" : variant || "default"}
          size="sm"
        >
          {busy ? "Saving…" : label}
        </Button>
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
