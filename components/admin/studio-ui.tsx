import { Badge } from "@/components/ui/badge";
import styles from "./studio.module.css";

export function StudioHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className={styles.pageHeading}>
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
export function StudioPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${styles.panel} ${className}`}>{children}</section>
  );
}
export function CourseStatus({ status }: { status: string }) {
  return (
    <Badge
      variant={status === "published" ? "success" : "muted"}
      className={styles.status}
    >
      <span className={styles.statusDot} />
      {status === "published"
        ? "Published"
        : status === "archived"
          ? "Archived"
          : "Draft"}
    </Badge>
  );
}
