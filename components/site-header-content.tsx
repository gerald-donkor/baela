import Link from "next/link";
import { Brand } from "./ui/brand";
import { SiteNavigation } from "./site-navigation";
import type { AccountMenuUser } from "./account-menu";

export function SiteHeaderContent({
  user,
  admin,
}: {
  user: AccountMenuUser | null;
  admin: boolean;
}) {
  return (
    <div className="shell flex h-22 items-center justify-between gap-4">
      <Link href="/" aria-label="Baela home" className="shrink-0">
        <Brand />
      </Link>
      <SiteNavigation user={user} admin={admin} />
    </div>
  );
}
