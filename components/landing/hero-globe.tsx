"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { createGlobeRenderer, GlobeStatus } from "./globe-renderer";
import styles from "./hero-globe.module.css";

export function HeroGlobe() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createGlobeRenderer>>(null);
  const [status, setStatus] = useState<GlobeStatus | "loading">("loading");

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
          animation = createGlobeRenderer(element, setStatus);
          renderer.current = animation;
        })
        .catch(() => {
          if (mounted) setStatus("static");
        });
    };
    start();
    motion.addEventListener("change", start);
    return () => {
      mounted = false;
      motion.removeEventListener("change", start);
      animation?.dispose();
      renderer.current = null;
    };
  }, []);

  const label = status === "paused" ? "Resume animation" : "Pause animation";
  const Icon = status === "paused" ? Play : Pause;

  return (
    <div className={styles.root}>
      <div className={styles.atmosphere} aria-hidden="true">
        <div className={styles.image}>
          <canvas ref={canvas} className={styles.canvas} />
        </div>
      </div>
      {status !== "loading" && status !== "static" && (
        <button
          className={styles.control}
          type="button"
          onClick={() => renderer.current?.toggle()}
        >
          <Icon size={12} aria-hidden="true" />
          {label}
        </button>
      )}
    </div>
  );
}
