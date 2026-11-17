"use client";

import { useEffect, useRef } from "react";

// A soft hallway of arches made with CSS 3D (no WebGL), so it stays light on
// phones. The vanishing point drifts a little with the pointer.
export default function Hall() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let tx = 50, ty = 42, cx = 50, cy = 42;
    const onMove = (e: PointerEvent) => {
      tx = 50 + (e.clientX / window.innerWidth - 0.5) * 14;
      ty = 42 + (e.clientY / window.innerHeight - 0.5) * 8;
    };
    const loop = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      el.style.perspectiveOrigin = `${cx}% ${cy}%`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="hall pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="hall-wall hall-left" />
      <div className="hall-wall hall-right" />
      <div className="hall-floor" />
      <div className="hall-glow" />
    </div>
  );
}
