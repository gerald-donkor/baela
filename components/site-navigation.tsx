"use client";

import Link from "next/link";
import { useState } from "react";
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
  const links = [
    { href: "/#courses", label: "Courses" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#reviews", label: "Reviews" },
    { href: "/#pricing", label: "Pricing" },
    ...(signedIn ? [{ href: "/dashboard", label: "My learning" }] : []),
    ...(admin ? [{ href: "/admin", label: "Admin" }] : []),
  ];
  return (
    <>
      <nav
        aria-label="Main navigation"
        className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-[13px] lg:flex"
      >
        {links.map(({ href, label }) => (
          <Link key={href} href={href} className="nav-link">
            {label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2 sm:gap-4">
        <ThemeToggle />
        <Link
          href={signedIn ? "/account" : "/auth/sign-in"}
          className="nav-link hidden text-[13px] sm:block"
        >
          {signedIn ? "Account" : "Sign in"}
        </Link>
        <Button
          asChild
          size="sm"
          className="border-foreground/20 bg-foreground bg-none text-background shadow-none hover:bg-foreground/90"
        >
          <Link href={signedIn ? "/dashboard" : "/#courses"}>
            {signedIn ? "My learning" : "Get started"}
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
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
