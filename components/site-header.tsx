import Link from "next/link";
import { getViewer } from "@/lib/auth/server";
import { Brand } from "./ui/brand";
import { SiteNavigation } from "./site-navigation";
export async function SiteHeader() {
  const user = await getViewer();
  return (
    <header className="relative z-30">
      <div className="shell flex h-22 items-center justify-between gap-5">
        <Link href="/" aria-label="Baela home">
          <Brand />
        </Link>
        <SiteNavigation signedIn={!!user} admin={!!user?.admin} />
      </div>
    </header>
  );
}
