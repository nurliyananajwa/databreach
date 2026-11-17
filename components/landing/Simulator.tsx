"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BUSINESSES,
  INCIDENTS,
  SCENARIOS,
  VERDICT_TEXT,
  assess,
  type BusinessId,
  type IncidentId,
} from "./scenarios";
import Watcher from "./Watcher";

function Pills<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.id)}
              className={`rounded-full border px-4 py-1.5 text-[0.95rem] transition-colors ${
                on ? "border-ink bg-ink text-white" : "border-rule bg-white hover:border-ink"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

// Live 72-hour countdown that starts when the visitor picks a scenario.
function Countdown({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, 72 * 3600 - Math.floor((now - startedAt) / 1000));
  const parts = [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60].map((n) => String(n).padStart(2, "0"));
  return (
    <span className="tabular-nums" aria-label={`${parts[0]} hours ${parts[1]} minutes left`}>
      {parts.join(":")}
    </span>
  );
}

export default function Simulator({ intro }: { intro?: React.ReactNode }) {
  const [business, setBusiness] = useState<BusinessId>("shop");
  const [incident, setIncident] = useState<IncidentId>("hack");
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const card = useRef<HTMLDivElement>(null);

  const scenario = SCENARIOS[business][incident];
  const { rules, verdict } = useMemo(() => assess(scenario), [scenario]);
  const text = VERDICT_TEXT[verdict];
  const key = `${business}-${incident}`;

  const pick = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setStartedAt(Date.now());
  };

  // Gentle tilt toward the pointer, like a card held in the hand.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = card.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    let raf = 0, x = 0, y = 0;
    const onMove = (e: PointerEvent) => {
      x = e.clientX / window.innerWidth - 0.5;
      y = e.clientY / window.innerHeight - 0.5;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        el.style.transform = `perspective(1200px) rotateY(${x * 6}deg) rotateX(${-y * 4}deg)`;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const mood = verdict === "both" ? "worried" : verdict === "commissioner" ? "alert" : "calm";

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
      <div className="grid gap-6">
        {intro}
        <Pills label="1. Pick a business" options={BUSINESSES} value={business} onChange={pick(setBusiness)} />
        <Pills label="2. Pick what went wrong" options={INCIDENTS} value={incident} onChange={pick(setIncident)} />
        <p className="max-w-md text-sm text-muted">
          Examples only. In the real system, your data protection lead checks the facts and makes
          the final decision.
        </p>
      </div>

      <div className="relative">
        <div className="absolute -top-12 right-6 z-10 sm:-top-14">
          <Watcher mood={mood} />
        </div>

        <div
          ref={card}
          className="sim-card relative rounded-2xl border border-white/80 bg-white shadow-[0_30px_80px_-30px_rgba(23,33,58,0.45)] transition-transform duration-300 ease-out"
          aria-live="polite"
        >
          <div key={key} className="sim-reveal p-6 sm:p-7">
            <p className="text-sm text-muted">What happened</p>
            <p className="mt-1 text-xl font-bold leading-snug">{scenario.what}</p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {scenario.fields.map((fl) => (
                <span
                  key={fl.name}
                  className={`rounded-full px-2.5 py-0.5 text-sm ${
                    fl.category === "sensitive"
                      ? "bg-stamp/10 text-stamp"
                      : fl.category === "financial" || fl.category === "identity"
                        ? "bg-[#fff1d6] text-[#7a4b00]"
                        : "bg-wash text-ink"
                  }`}
                >
                  {fl.name}
                </span>
              ))}
              <span className="rounded-full border border-rule px-2.5 py-0.5 text-sm tabular-nums">
                {scenario.people.toLocaleString("en-MY")} {scenario.people === 1 ? "person" : "people"}
              </span>
            </div>

            <ul className="mt-5 divide-y divide-rule border-y border-rule">
              {rules.map((r, i) => (
                <li key={r.code} className="sim-rule flex items-center gap-3 py-2" style={{ animationDelay: `${150 + i * 110}ms` }}>
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      r.met === true ? "bg-stamp text-white" : r.met === false ? "bg-wash text-muted" : "border-2 border-dashed border-rule text-muted"
                    }`}
                    aria-hidden="true"
                  >
                    {r.met === true ? "!" : r.met === false ? "–" : "?"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={r.met ? "font-bold" : ""}>{r.label}</span>
                    <span className="block text-sm text-muted">{r.why}</span>
                  </span>
                  <span className="sr-only">{r.met === true ? "met" : r.met === false ? "not met" : "needs judgement"}</span>
                </li>
              ))}
            </ul>

            <div
              className={`sim-verdict mt-5 rounded-xl p-4 ${
                verdict === "both" ? "bg-stamp text-white" : verdict === "commissioner" ? "bg-ink text-white" : "bg-met/10 text-met"
              }`}
            >
              <p className="text-lg font-bold leading-snug">{text.title}</p>
              <p className={`mt-1 text-sm ${verdict === "register" ? "" : "text-white/85"}`}>{text.body}</p>
              {verdict !== "register" && (
                <p className="mt-3 flex items-baseline justify-between gap-3 border-t border-white/25 pt-3">
                  <span className="text-sm text-white/85">Time left to tell the Commissioner</span>
                  <span className="text-2xl font-bold">
                    <Countdown key={startedAt} startedAt={startedAt} />
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
