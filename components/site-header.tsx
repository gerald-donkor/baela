import Link from "next/link";
import { getViewer } from "@/lib/auth/server";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
export async function SiteHeader() {
  const user = await getViewer();
  return (
    <header className="border-b border-border/70 bg-background/90">
      <div className="shell flex min-h-20 flex-wrap items-center justify-between gap-3 py-3">
        <Link
          href="/"
          className="text-3xl font-semibold tracking-tighter"
          aria-label="Baela home"
        >
          baela<span className="text-primary">.</span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-3 sm:gap-7 text-sm"
        >
          <Link href="/#courses" className="nav-link">
            Courses
          </Link>
          <Link href="/#pricing" className="nav-link">
            Pricing
          </Link>
          {user && (
            <Link href="/dashboard" className="nav-link">
              My learning
            </Link>
          )}
          {user?.admin && (
            <Link href="/admin" className="nav-link">
              Admin
            </Link>
          )}
          <ThemeToggle />
          <Button asChild size="sm" variant="outline">
            <Link href={user ? "/account" : "/auth/sign-in"}>
              {user ? "Account" : "Sign in"}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
