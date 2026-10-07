import { Sparkles } from "lucide-react";
import { AuthGlobe } from "./auth-globe";
import styles from "./auth.module.css";

export function AuthVisual() {
  return (
    <aside className={styles.visual} aria-label="A new horizon for learning">
      <div className={styles.visualCopy}>
        <span className={styles.badge}>
          <Sparkles size={13} strokeWidth={1.5} aria-hidden="true" />A new
          horizon for learning
        </span>
        <p className={styles.visualTitle}>
          A little curiosity.
          <br />A world of possibility.
        </p>
        <p className={styles.visualDescription}>
          One idea, one lesson, one new chapter.
          <br />
          See where your curiosity takes you.
        </p>
      </div>
      <AuthGlobe />
      <p className={styles.visualNote}>
        <span /> At your pace. On your terms.
      </p>
    </aside>
  );
}
