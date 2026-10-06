import Link from "next/link";
import { Brand } from "./ui/brand";
import { SiteNavigation } from "./site-navigation";

export function SiteHeaderContent({
  signedIn,
  admin,
}: {
  signedIn: boolean;
  admin: boolean;
}) {
  return (
    <div className="shell flex h-22 items-center justify-between gap-4">
      <Link href="/" aria-label="Baela home" className="shrink-0">
        <Brand />
      </Link>
      <SiteNavigation signedIn={signedIn} admin={admin} />
    </div>
  );
}
