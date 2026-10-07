"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { authClient } from "@/lib/auth/client";

export type AccountMenuUser = {
  name: string;
  email: string;
};

export function AccountMenu({
  user,
  onOpenChange,
}: {
  user: AccountMenuUser;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const name = user.name.trim() || user.email;
  const initial = Array.from(name)[0]?.toLocaleUpperCase() || "?";

  async function signOut() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Sign-out failed.");
      router.replace("/");
      router.refresh();
    } catch {
      setError("Couldn’t sign out. Please try again.");
      setBusy(false);
    }
  }

  return (
    <DropdownMenu.Root modal={false} onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Open account menu for ${name}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-primary"
        >
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-full border border-white/20 bg-[#2075a5] text-sm font-medium text-white shadow-[inset_0_1px_2px_#ffffff20]"
          >
            {initial}
          </span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          aria-label="Account menu"
          align="end"
          sideOffset={6}
          collisionPadding={16}
          className="z-50 w-60 max-w-[calc(100vw-2rem)] overflow-hidden rounded-control border bg-card text-card-foreground shadow-xl"
        >
          <DropdownMenu.Item asChild>
            <Link
              href="/account"
              aria-label="Manage account"
              className="block px-3 py-2.5 outline-none data-highlighted:bg-secondary"
            >
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="h-px bg-border" />
          <DropdownMenu.Item
            disabled={busy}
            onSelect={(event) => {
              event.preventDefault();
              void signOut();
            }}
            aria-busy={busy}
            className="flex min-h-11 cursor-pointer items-center gap-2 px-3 py-2 text-sm outline-none data-disabled:cursor-wait data-disabled:opacity-60 data-highlighted:bg-secondary"
          >
            <LogOut aria-hidden="true" className="size-4" />
            {busy ? "Signing out…" : "Sign out"}
          </DropdownMenu.Item>
          {error && (
            <p role="alert" className="px-3 pb-3 text-xs text-destructive">
              {error}
            </p>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
