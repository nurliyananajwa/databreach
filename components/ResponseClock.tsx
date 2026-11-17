"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// A fictional incident, played fast: 20 h 15 m of response in about 8 seconds.
const WINDOW_H = 72;
const SENT_AT_H = 20.25;
const PLAY_MS = 8000;

const STEPS = [
  { at: 2.5, label: "Exposed fields confirmed", note: "Full name, phone number" },
  { at: 5, label: "Assessment run", note: "1,240 people: significant scale" },
  { at: 7.5, label: "Decision recorded", note: "Notify the Commissioner" },
  { at: 18, label: "Draft approved by manager", note: "Official form fields filled in" },
  { at: SENT_AT_H, label: "Commissioner notified", note: "Recorded as sent by email" },
];

function hms(hours: number) {
  const total = Math.max(0, Math.round(hours * 3600));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0"));
}

export default function ResponseClock() {
  const [elapsed, setElapsed] = useState(0);
  const frame = useRef<number | null>(null);

  const play = useCallback(() => {
    if (frame.current) cancelAnimationFrame(frame.current);
    let start: number | null = null;
    const tick = (now: number) => {
      // first frame sets the start; clamp so the clock can never exceed 72 h
      start ??= now;
      const t = Math.min(1, Math.max(0, (now - start) / PLAY_MS));
      // ease out, so the last steps land slowly
      const eased = 1 - Math.pow(1 - t, 2.2);
      setElapsed(eased * SENT_AT_H);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setElapsed(SENT_AT_H);
      return;
    }
    const delay = window.setTimeout(play, 700);
    return () => {
      window.clearTimeout(delay);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [play]);

  const done = elapsed >= SENT_AT_H;
  const [h, m, s] = hms(WINDOW_H - elapsed);
  const spare = hms(WINDOW_H - SENT_AT_H);

  return (
    <figure className="relative rounded-md border border-rule bg-sheet shadow-[0_1px_0_var(--color-rule),0_18px_40px_-24px_rgba(23,33,58,0.35)]">
      <figcaption className="sr-only">
        Example: a fictional breach at Kedai Runcit Maju. The Commissioner was notified 20 hours
        15 minutes after the business became aware, with 51 hours 45 minutes to spare.
      </figcaption>

      <div className="flex items-baseline justify-between gap-4 border-b border-rule px-5 py-3 text-sm">
        <span className="font-bold">INC-007</span>
        <span className="text-muted">Kedai Runcit Maju (fictional)</span>
      </div>

      <div className="px-5 pt-5" aria-hidden="true">
        <p className="text-sm text-muted">Customer list emailed to the wrong address</p>
        <p className="mt-4 text-sm">
          {done ? "Commissioner notified with time to spare" : "Time left to notify the Commissioner"}
        </p>
        <p
          className={`mt-1 font-bold tabular-nums leading-none tracking-tight transition-colors duration-500 motion-reduce:transition-none ${
            done ? "text-met" : elapsed > 16 ? "text-stamp" : "text-ink"
          }`}
          style={{ fontSize: "clamp(2.75rem, 7vw, 4.25rem)" }}
        >
          {done ? `${spare[0]}h ${spare[1]}m` : `${h}:${m}:${s}`}
        </p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-wash">
          <div
            className={`h-full rounded-full ${done ? "bg-met" : "bg-ink"}`}
            style={{ width: `${(elapsed / WINDOW_H) * 100}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-muted tabular-nums">
          <span>Became aware</span>
          <span>72 h</span>
        </div>
      </div>

      <ol className="mt-5 border-t border-rule px-5 py-3" aria-hidden="true">
        {STEPS.map((step) => {
          const ticked = elapsed >= step.at;
          return (
            <li key={step.label} className="flex items-start gap-3 py-2">
              <span
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-[3px] border-2 transition-colors duration-300 motion-reduce:transition-none ${
                  ticked ? "border-met bg-met text-white" : "border-rule bg-sheet"
                }`}
              >
                {ticked && (
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="min-w-0">
                <span className={`block text-[0.95rem] leading-snug ${ticked ? "" : "text-muted"}`}>
                  {step.label}
                </span>
                <span className="block text-sm leading-snug text-muted">
                  {ticked ? step.note : " "}
                </span>
              </span>
              <span className="ml-auto pl-2 text-sm tabular-nums text-muted">
                {ticked ? `${Math.floor(step.at)}h ${String(Math.round((step.at % 1) * 60)).padStart(2, "0")}m` : ""}
              </span>
            </li>
          );
        })}
      </ol>

      {done && (
        <span
          className="stamp-in pointer-events-none absolute right-5 top-[7.6rem] rounded-sm border-[3px] border-met px-2.5 py-0.5 text-lg font-bold tracking-wider text-met opacity-90 mix-blend-multiply"
          aria-hidden="true"
        >
          MET
        </span>
      )}

      <div className="flex items-center justify-between border-t border-rule px-5 py-3 text-sm">
        <span className="text-muted">Example with fictional data, played fast</span>
        <button
          type="button"
          onClick={play}
          className="whitespace-nowrap font-bold underline decoration-rule decoration-2 underline-offset-4 hover:decoration-ink"
        >
          Play again
        </button>
      </div>
    </figure>
  );
}
