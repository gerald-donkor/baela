import styles from "@/components/admin/studio.module.css";

export default function StudioLoading() {
  return (
    <div role="status" aria-label="Loading Studio" className="space-y-6">
      <p className="text-sm text-muted-foreground">Loading your Studio…</p>
      <div aria-hidden="true" className={`${styles.panel} h-48 bg-muted/30`} />
      <div aria-hidden="true" className={`${styles.panel} h-80 bg-muted/30`} />
    </div>
  );
}
