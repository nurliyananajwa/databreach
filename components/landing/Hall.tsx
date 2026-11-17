"use client";

import { useEffect, useRef } from "react";

// A soft hallway of arches made with CSS 3D (no WebGL). It moves only while
// the pointer moves, and stops redrawing as soon as it settles.
export default function Hall() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return; // phones: keep it still

    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const step = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      el.style.setProperty("--hx", `${cx.toFixed(2)}px`);
      el.style.setProperty("--hy", `${cy.toFixed(2)}px`);
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3 ? requestAnimationFrame(step) : 0;
    };
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * -24;
      ty = (e.clientY / window.innerHeight - 0.5) * -12;
      if (!raf) raf = requestAnimationFrame(step);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="hall pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div ref={ref} className="hall-scene">
        <div className="hall-wall hall-left" />
        <div className="hall-wall hall-right" />
        <div className="hall-floor" />
      </div>
      <div className="hall-glow" />
    </div>
  );
}
