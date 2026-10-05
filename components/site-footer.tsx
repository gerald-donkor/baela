import Link from "next/link";
import { businessProfile } from "@/lib/server/catalog";
import { Brand } from "./ui/brand";
export async function SiteFooter() {
  const business = await businessProfile();
  return (
    <footer className="border-t border-border/70 mt-20">
      <div className="shell py-10 flex flex-wrap gap-6 items-center justify-between">
        <div>
          <Link href="/" aria-label="Baela home">
            <Brand />
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            {business?.instructor
              ? "Learn with " + business.instructor + "."
              : "A little curiosity goes a long way."}
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-5 text-xs text-muted-foreground"
        >
          <Link href="/support">Support</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/refund-policy">Refunds</Link>
        </nav>
      </div>
    </footer>
  );
}
