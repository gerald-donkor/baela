"use client";

import { useEffect, useRef } from "react";
import type { createAuthGlobeRenderer } from "./auth-globe-renderer";
import styles from "./auth.module.css";

export function AuthGlobe() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let mounted = true;
    let loading = false;
    let visible = false;
    let animation: ReturnType<typeof createAuthGlobeRenderer> | null = null;

    const start = () => {
      if (!visible || motion.matches || animation || loading) return;
      loading = true;
      void import("./auth-globe-renderer")
        .then(({ createAuthGlobeRenderer }) => {
          if (mounted && visible && !motion.matches && !animation)
            animation = createAuthGlobeRenderer(element);
        })
        .catch(() => {
          // The matching SVG stays visible when WebGL cannot be loaded.
        })
        .finally(() => {
          loading = false;
        });
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    observer.observe(element);
    motion.addEventListener("change", start);

    return () => {
      mounted = false;
      observer.disconnect();
      motion.removeEventListener("change", start);
      animation?.dispose();
    };
  }, []);

  return (
    <div className={styles.globe} aria-hidden="true">
      <canvas ref={canvas} className={styles.canvas} />
    </div>
  );
}
