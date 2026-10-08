"use client";
import { Button } from "@/components/ui/button";
import { StudioHeading } from "@/components/admin/studio-ui";
import styles from "@/components/admin/studio.module.css";

export default function StudioError({ reset }: { reset: () => void }) {
  return (
    <section className={styles.panel}>
      <StudioHeading
        title="Studio couldn’t load."
        description="Your changes haven’t been removed. Check your connection and try again. If this continues, check the database and service configuration."
      />
      <Button onClick={reset}>Try again</Button>
    </section>
  );
}
