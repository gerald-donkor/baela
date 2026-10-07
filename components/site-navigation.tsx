"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";

export function SiteNavigation({
  signedIn,
  admin,
}: {
  signedIn: boolean;
  admin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function dismissOutside(event: Event) {
      const target = event.target;
      if (
        target instanceof Node &&
        !menuRef.current?.contains(target) &&
        !toggleRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    const desktop = window.matchMedia("(min-width: 1024px)");
    function dismissOnDesktop() {
      if (desktop.matches) setOpen(false);
    }
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("focusin", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    desktop.addEventListener("change", dismissOnDesktop);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("focusin", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
      desktop.removeEventListener("change", dismissOnDesktop);
    };
  }, [open]);
  const links = [
    { href: "/courses", label: "Courses" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#reviews", label: "Reviews" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/dashboard", label: "My learning" },
    ...(admin ? [{ href: "/admin", label: "Admin" }] : []),
  ];
  return (
    <>
      <nav
        aria-label="Main navigation"
        className="hidden flex-1 items-center justify-center gap-4 whitespace-nowrap text-[13px] lg:flex xl:gap-7"
      >
        {links.map(({ href, label }) => (
          <Link key={href} href={href} className="nav-link py-3">
            {label}
          </Link>
        ))}
      </nav>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <ThemeToggle />
        <Link
          href={signedIn ? "/account" : "/auth/sign-in"}
          className="nav-link hidden py-3 text-[13px] sm:block"
        >
          {signedIn ? "Account" : "Sign in"}
        </Link>
        <Button
          asChild
          size="sm"
          className="hidden h-11 border-foreground/20 bg-foreground bg-none text-background shadow-none hover:bg-foreground/90 min-[360px]:inline-flex"
        >
          <Link href={signedIn ? "/dashboard" : "/#courses"}>
            {signedIn ? "My learning" : "Get started"}
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          ref={toggleRef}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>
      {open && (
        <nav
          id={menuId}
          ref={menuRef}
          aria-label="Mobile navigation"
          className="absolute inset-x-4 top-20 grid gap-1 rounded-card border bg-card p-3 shadow-xl lg:hidden"
        >
          {[
            ...links,
            {
              href: signedIn ? "/account" : "/auth/sign-in",
              label: signedIn ? "Account" : "Sign in",
            },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="rounded-control px-3 py-3 text-sm hover:bg-secondary"
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
