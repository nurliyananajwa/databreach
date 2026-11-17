"use client";

import { useEffect, useRef, useState } from "react";

// A small shield with eyes that follow the pointer and react to the verdict.
export default function Watcher({ mood }: { mood: "calm" | "alert" | "worried" }) {
  const ref = useRef<SVGSVGElement>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      const dx = e.clientX - (box.left + box.width / 2);
      const dy = e.clientY - (box.top + box.height / 2);
      const len = Math.max(1, Math.hypot(dx, dy));
      const reach = Math.min(1, len / 300);
      setLook({ x: (dx / len) * 4.5 * reach, y: (dy / len) * 4.5 * reach });
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const eyeH = mood === "worried" ? 15 : mood === "alert" ? 13 : 11;
  const fill = mood === "worried" ? "var(--color-stamp)" : mood === "alert" ? "var(--color-ink)" : "var(--color-met)";

  return (
    <svg ref={ref} viewBox="0 0 80 88" className="watcher size-16 drop-shadow-sm sm:size-20" aria-hidden="true">
      <path
        d="M40 4 72 16v26c0 22-14 36-32 42C22 78 8 64 8 42V16Z"
        fill={fill}
        className="transition-[fill] duration-500"
      />
      {[28, 52].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy={40} rx={9} ry={eyeH} fill="#fff" className="transition-all duration-300" />
          <circle cx={cx + look.x} cy={40 + look.y} r={4.6} fill="#17213a" />
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
