"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BUSINESSES, SCENARIOS, VERDICT_TEXT, assess, type BusinessId, type IncidentId } from "./scenarios";

// Three colours only: ink (navy), paper/white, and stamp (red) for urgency.

const icon = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const INCIDENTS: { id: IncidentId; label: string; svg: React.ReactNode }[] = [
  {
    id: "laptop",
    label: "Laptop stolen",
    svg: (
      <svg viewBox="0 0 32 32" className="size-7" {...icon}>
        <rect x="6" y="7" width="20" height="13" rx="1.5" />
        <path d="M3 24h26l-2 2.5H5Z" />
      </svg>
    ),
  },
  {
    id: "email",
    label: "Email to the wrong person",
    svg: (
      <svg viewBox="0 0 32 32" className="size-7" {...icon}>
        <rect x="4" y="8" width="24" height="17" rx="2" />
        <path d="m5 10 11 8 11-8" />
      </svg>
    ),
  },
  {
    id: "hack",
    label: "Database hacked",
    svg: (
      <svg viewBox="0 0 32 32" className="size-7" {...icon}>
        <ellipse cx="16" cy="8" rx="10" ry="3.5" />
        <path d="M6 8v16c0 2 4.5 3.5 10 3.5s10-1.5 10-3.5V8M6 16c0 2 4.5 3.5 10 3.5s10-1.5 10-3.5" />
      </svg>
    ),
  },
  {
    id: "whatsapp",
    label: "WhatsApp leak",
    svg: (
      <svg viewBox="0 0 32 32" className="size-7" {...icon}>
        <rect x="9" y="3.5" width="14" height="25" rx="2.5" />
        <path d="M13 9.5h6M13 13.5h4M13 17.5h6" />
      </svg>
    ),
  },
];

// Countdown ring: drains over 72 hours from the moment a breach is picked.
function Ring({ startedAt, urgent }: { startedAt: number; urgent: boolean }) {
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const total = 72 * 3600;
  const left = Math.max(0, total - Math.floor((now - startedAt) / 1000));
  const hms = [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60].map((n) => String(n).padStart(2, "0"));
  const C = 2 * Math.PI * 52;
  return (
    <div className="relative size-36 shrink-0 sm:size-40">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-rule)" strokeWidth="6" />
        <circle
          className="ring-draw"
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={urgent ? "var(--color-stamp)" : "var(--color-ink)"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - left / total)}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="text-xl font-bold tabular-nums">{hms.join(":")}</span>
        <span className="mx-auto mt-0.5 max-w-[6.5rem] text-xs leading-tight text-muted">left to notify the Commissioner</span>
      </div>
    </div>
  );
}

export default function Console() {
  const [business, setBusiness] = useState<BusinessId>("shop");
  const [incident, setIncident] = useState<IncidentId>("hack");
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const panel = useRef<HTMLDivElement>(null);

  const scenario = SCENARIOS[business][incident];
  const { rules, verdict } = useMemo(() => assess(scenario), [scenario]);
  const key = `${business}-${incident}`;

  const restart = () => setStartedAt(Date.now());

  // On small screens the result sits below the choices: bring it into view.
  const reveal = () =>
    requestAnimationFrame(() => {
      const el = panel.current;
      if (!el || window.innerWidth >= 1024) return;
      const r = el.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.6) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }
    });

  const who = scenario.people === 1 ? "1 person" : `${scenario.people.toLocaleString("en-MY")} people`;

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
      <div>
        <h1 className="font-bold leading-[1.0] tracking-[-0.03em]" style={{ fontSize: "clamp(2.5rem, 4.8vw, 4.4rem)" }}>
          A data breach just happened. What do you do?
        </h1>
        <p className="mt-5 max-w-lg text-lg text-muted">
          Choose a business and what went wrong. See what the law asks of you, and how this
          tracker helps a small business respond on time.
        </p>

        <div className="mt-8">
          <p className="text-sm font-bold">Business</p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Business">
            {BUSINESSES.map((b) => (
              <button
                key={b.id}
                type="button"
                aria-pressed={b.id === business}
                onClick={() => {
                  setBusiness(b.id);
                  restart();
                }}
                className={`rounded-md border px-3 py-1.5 text-[0.95rem] transition-colors ${
                  b.id === business ? "border-ink bg-ink text-white" : "border-rule bg-white hover:border-ink"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-bold">What went wrong</p>
          <ul className="mt-2 grid grid-cols-2 gap-3">
            {INCIDENTS.map((it) => {
              const on = it.id === incident;
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setIncident(it.id);
                      restart();
                      reveal();
                    }}
                    className={`tile flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-[transform,border-color,background-color,box-shadow] duration-200 ${
                      on
                        ? "border-ink bg-ink text-white shadow-[0_12px_28px_-14px_rgba(23,33,58,0.6)]"
                        : "border-rule bg-white hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_12px_28px_-18px_rgba(23,33,58,0.5)]"
                    }`}
                  >
                    {it.svg}
                    <span className="font-bold leading-snug">{it.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div ref={panel} className="scroll-mt-6">
        <div className="rounded-xl border border-rule bg-white shadow-[0_30px_70px_-40px_rgba(23,33,58,0.5)]" aria-live="polite">
          <div className="flex items-center justify-between border-b border-rule px-6 py-3 text-sm">
            <span className="font-bold">Breach assessment</span>
            <span className="text-muted">Example</span>
          </div>

          <div key={key} className="console-in p-6">
            <p className="text-sm text-muted">{who} affected</p>
            <p className="mt-1 text-xl font-bold leading-snug">{scenario.what}.</p>

            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Personal data exposed">
              {scenario.fields.map((f, i) => (
                <li
                  key={f.name}
                  className={`chip-in rounded border px-2 py-0.5 text-sm ${
                    f.category === "sensitive" || f.category === "financial" || f.category === "identity"
                      ? "border-stamp/40 text-stamp"
                      : "border-rule text-ink"
                  }`}
                  style={{ animationDelay: `${80 + i * 60}ms` }}
                >
                  {f.name}
                </li>
              ))}
            </ul>

            <ul className="mt-5 border-t border-rule">
              {rules.map((r, i) => (
                <li key={r.code} className="rule-in flex items-center gap-3 border-b border-rule py-2.5" style={{ animationDelay: `${300 + i * 90}ms` }}>
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-full border text-[0.7rem] font-bold ${
                      r.met === true ? "border-stamp bg-stamp text-white" : r.met === false ? "border-rule text-muted" : "border-dashed border-muted text-muted"
                    }`}
                    aria-hidden="true"
                  >
                    {r.met === true ? "✓" : r.met === false ? "" : "?"}
                  </span>
                  <span className="min-w-0 flex-1 text-[0.95rem]">
                    <span className={`block ${r.met ? "font-bold" : ""}`}>{r.label}</span>
                    <span className="block text-sm text-muted">{r.why}</span>
                  </span>
                  <span className="sr-only">{r.met === true ? "met" : r.met === false ? "not met" : "needs judgement"}</span>
                </li>
              ))}
            </ul>

            <div className="verdict-in mt-6 flex flex-wrap items-center gap-6">
              {verdict === "register" ? (
                <div className="grid size-36 shrink-0 place-content-center rounded-full border-[6px] border-rule text-center sm:size-40">
                  <span className="text-sm font-bold">No notice</span>
                  <span className="text-xs text-muted">record only</span>
                </div>
              ) : (
                <Ring key={startedAt} startedAt={startedAt} urgent={verdict === "both"} />
              )}
              <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
                <p className={`text-lg font-bold leading-snug ${verdict === "both" ? "text-stamp" : ""}`}>{VERDICT_TEXT[verdict].title}</p>
                <p className="mt-1 text-[0.95rem] text-muted">{VERDICT_TEXT[verdict].body}</p>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">Examples only. In the real system, your data protection lead makes the final decision.</p>
      </div>
    </div>
  );
}
