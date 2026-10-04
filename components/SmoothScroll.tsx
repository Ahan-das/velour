"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { setLenis } from "@/lib/lenis";

/**
 * Inertial smooth scrolling. Lenis drives the native scroll position, so
 * Motion's useScroll, sticky positioning and anchors all keep working.
 * Skipped for reduced motion and on touch screens, where native scrolling
 * already feels right.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: { offset: -24 } });
    setLenis(lenis);
    let raf = requestAnimationFrame(function loop(t) {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      setLenis(null);
      lenis.destroy();
    };
  }, []);
  return null;
}
