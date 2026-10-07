"use client";

import { useEffect, useRef } from "react";
import type { createGlobeRenderer } from "./globe-renderer";
import styles from "./hero-globe.module.css";

export function HeroGlobe() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let mounted = true;
    let animation: ReturnType<typeof createGlobeRenderer> | null = null;
    const start = () => {
      if (motion.matches || animation) return;
      void import("./globe-renderer")
        .then(({ createGlobeRenderer }) => {
          if (!mounted || motion.matches || animation) return;
          animation = createGlobeRenderer(element);
        })
        .catch(() => {
          // The supplied still image remains visible if the renderer cannot load.
        });
    };
    start();
    motion.addEventListener("change", start);
    return () => {
      mounted = false;
      motion.removeEventListener("change", start);
      animation?.dispose();
    };
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.atmosphere} aria-hidden="true">
        <div className={styles.image}>
          <canvas ref={canvas} className={styles.canvas} />
        </div>
      </div>
    </div>
  );
}
