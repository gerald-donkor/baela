"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  FolderOpen,
  LifeBuoy,
  Settings2,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import styles from "./studio.module.css";

const navigation = [
  { href: "/admin", label: "Courses", icon: BookOpen },
  { href: "/admin/media", label: "Media library", icon: FolderOpen },
  { href: "/admin/users", label: "Students", icon: Users },
  { href: "/admin/refunds", label: "Refund requests", icon: LifeBuoy },
  { href: "/admin/jobs", label: "Background jobs", icon: Workflow },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
];

export function StudioShell({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string;
}) {
  const pathname = usePathname();
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.studioBrand}>
          <span className={styles.brandIcon}>
            <BookOpen size={18} />
          </span>
          <span>
            Creator studio<small>Baela</small>
          </span>
        </Link>
        <nav aria-label="Administration" className={styles.navigation}>
          {navigation.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/admin"
                ? pathname === href ||
                  pathname.startsWith("/admin/courses/") ||
                  pathname.startsWith("/admin/preview/")
                : pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={active ? styles.navActive : styles.navItem}
              >
                <Icon size={17} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className={styles.sidebarBottom}>
          <Link href="/" className={styles.visitLink}>
            View your site <ArrowUpRight size={15} />
          </Link>
          <div className={styles.identity}>
            <span className={styles.avatar}>
              {name.charAt(0).toUpperCase()}
            </span>
            <span>
              {name}
              <small>
                <ShieldCheck size={12} /> Administrator
              </small>
            </span>
          </div>
        </div>
      </aside>
      <div className={styles.workspace}>{children}</div>
    </div>
  );
}
