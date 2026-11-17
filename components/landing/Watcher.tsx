"use client";

import { useEffect, useRef } from "react";

// A small shield whose eyes follow the pointer. Pupils move by direct style
// updates (no React re-render per mouse move), at most once per frame.
export default function Watcher({ mood }: { mood: "calm" | "alert" | "worried" }) {
  const svg = useRef<SVGSVGElement>(null);
  const pupils = useRef<(SVGCircleElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, px = 0, py = 0;
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const box = svg.current?.getBoundingClientRect();
        if (!box) return;
        const dx = px - (box.left + box.width / 2);
        const dy = py - (box.top + box.height / 2);
        const len = Math.max(1, Math.hypot(dx, dy));
        const reach = Math.min(1, len / 300);
        const t = `translate(${((dx / len) * 4.5 * reach).toFixed(2)}px, ${((dy / len) * 4.5 * reach).toFixed(2)}px)`;
        pupils.current.forEach((p) => p && (p.style.transform = t));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const eyeH = mood === "worried" ? 15 : mood === "alert" ? 13 : 11;
  const fill = mood === "worried" ? "var(--color-stamp)" : mood === "alert" ? "var(--color-ink)" : "var(--color-met)";

  return (
    <svg ref={svg} viewBox="0 0 80 88" className="size-16 sm:size-20" aria-hidden="true">
      <path d="M40 4 72 16v26c0 22-14 36-32 42C22 78 8 64 8 42V16Z" fill={fill} className="transition-[fill] duration-500" />
      {[28, 52].map((cx, i) => (
        <g key={cx}>
          <ellipse cx={cx} cy={40} rx={9} ry={eyeH} fill="#fff" />
          <circle ref={(el) => { pupils.current[i] = el; }} cx={cx} cy={40} r={4.6} fill="#17213a" />
        </g>
      ))}
      {mood === "worried" && (
        <g stroke="#fff" strokeWidth="3" strokeLinecap="round">
          <path d="M20 22l12 5" />
          <path d="M60 22l-12 5" />
        </g>
      )}
    </svg>
  );
}
