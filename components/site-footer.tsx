import Link from "next/link";
import { businessProfile } from "@/lib/server/catalog";
export async function SiteFooter() {
  const business = await businessProfile();
  return (
    <footer className="border-t border-border mt-20">
      <div className="shell py-10 flex flex-wrap gap-6 items-center justify-between">
        <div>
          <Link href="/" className="text-2xl font-semibold tracking-tighter">
            baela.
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            {business?.instructor
              ? "Learn with " + business.instructor + "."
              : "A little curiosity goes a long way."}
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="flex gap-5 text-sm text-muted-foreground"
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
