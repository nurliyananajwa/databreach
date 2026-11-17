"use client";

import { useEffect, useRef } from "react";

export type Mood = "idle" | "calm" | "alert" | "worried";

const FILL: Record<Mood, string> = {
  idle: "#17213a",
  calm: "#26704f",
  alert: "#3b3f99",
  worried: "#c2342a",
};

// Big shield character. Eyes follow the pointer (direct style updates, at most
// once per frame); it jolts whenever `bump` changes.
export default function Mascot({ mood, bump }: { mood: Mood; bump: number }) {
  const svg = useRef<SVGSVGElement>(null);
  const pupils = useRef<(SVGGElement | null)[]>([]);

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
        const dy = py - (box.top + box.height * 0.42);
        const len = Math.max(1, Math.hypot(dx, dy));
        const reach = Math.min(1, len / 260);
        const t = `translate(${((dx / len) * 7 * reach).toFixed(1)}px, ${((dy / len) * 7 * reach).toFixed(1)}px)`;
        pupils.current.forEach((p) => p && (p.style.transform = t));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const eyeRy = mood === "worried" ? 19 : mood === "alert" ? 17 : 15;
  const mouth =
    mood === "worried"
      ? "M84 132q8-8 16 0t16 0t16 0" // wobbly
      : mood === "alert"
        ? "M88 134h40" // flat
        : mood === "calm"
          ? "M86 128q22 18 44 0" // smile
          : "M90 130q18 10 36 0"; // small smile

  return (
    <svg ref={svg} viewBox="0 0 216 232" className="h-auto w-full" aria-hidden="true">
      <ellipse cx="108" cy="222" rx="62" ry="8" fill="#17213a" opacity="0.12" />
      <g key={bump} className="mascot-jolt" style={{ transformOrigin: "108px 200px" }}>
        <path
          d="M108 8 196 40v66c0 58-37 96-88 114C57 202 20 164 20 106V40Z"
          fill={FILL[mood]}
          stroke="#17213a"
          strokeWidth="6"
          strokeLinejoin="round"
          className="transition-[fill] duration-500"
        />
        <path d="M108 26 178 52v52c0 46-29 77-70 92" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="10" strokeLinecap="round" />
        {[78, 138].map((cx, i) => (
          <g key={cx}>
            <ellipse cx={cx} cy={92} rx={20} ry={eyeRy} fill="#fff" stroke="#17213a" strokeWidth="5" />
            <g ref={(el) => { pupils.current[i] = el; }} className="mascot-pupil">
              <circle cx={cx} cy={94} r={9} fill="#17213a" />
              <circle cx={cx + 3} cy={90} r={3} fill="#fff" />
            </g>
          </g>
        ))}
        {mood === "worried" && (
          <g stroke="#17213a" strokeWidth="6" strokeLinecap="round">
            <path d="M58 62l26 10" />
            <path d="M158 62l-26 10" />
          </g>
        )}
        <circle cx="58" cy="124" r="10" fill="#ff9fb2" opacity="0.8" />
        <circle cx="158" cy="124" r="10" fill="#ff9fb2" opacity="0.8" />
        <path d={mouth} fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
