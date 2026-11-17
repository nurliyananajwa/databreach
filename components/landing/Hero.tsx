"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DataCloud, { type CloudHandle, type Kind } from "./DataCloud";
import { BUSINESSES, SCENARIOS, VERDICT_TEXT, assess, type BusinessId, type Field, type IncidentId } from "./scenarios";

const icon = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const INCIDENTS: { id: IncidentId; label: string; svg: React.ReactNode }[] = [
  { id: "laptop", label: "Laptop stolen", svg: <svg viewBox="0 0 32 32" className="size-6" {...icon}><rect x="6" y="7" width="20" height="13" rx="1.5" /><path d="M3 24h26l-2 2.5H5Z" /></svg> },
  { id: "email", label: "Email to the wrong person", svg: <svg viewBox="0 0 32 32" className="size-6" {...icon}><rect x="4" y="8" width="24" height="17" rx="2" /><path d="m5 10 11 8 11-8" /></svg> },
  { id: "hack", label: "Database hacked", svg: <svg viewBox="0 0 32 32" className="size-6" {...icon}><ellipse cx="16" cy="8" rx="10" ry="3.5" /><path d="M6 8v16c0 2 4.5 3.5 10 3.5s10-1.5 10-3.5V8M6 16c0 2 4.5 3.5 10 3.5s10-1.5 10-3.5" /></svg> },
  { id: "whatsapp", label: "WhatsApp leak", svg: <svg viewBox="0 0 32 32" className="size-6" {...icon}><rect x="9" y="3.5" width="14" height="25" rx="2.5" /><path d="M13 9.5h6M13 13.5h4M13 17.5h6" /></svg> },
];

// Which cloud fragments light up for each exposed field.
function kindOf(f: Field): Kind {
  const n = f.name.toLowerCase();
  if (n.includes("email")) return "email";
  if (n.includes("address")) return "address";
  if (n.includes("phone")) return "phone";
  if (n.includes("birth")) return "dob";
  if (n.includes("photo")) return "photo";
  if (n.includes("salary")) return "salary";
  if (n.includes("card") || n.includes("fee")) return "card";
  if (n.includes("bank")) return "bank";
  if (f.category === "identity") return "ic";
  if (f.category === "sensitive") return "health";
  if (f.category === "financial") return "bank";
  return "name";
}

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
    <div className="relative size-32 shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-rule)" strokeWidth="6" />
        <circle className="ring-draw" cx="60" cy="60" r="52" fill="none" stroke={urgent ? "var(--color-stamp)" : "var(--color-ink)"} strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - left / total)} />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="text-lg font-bold tabular-nums">{hms.join(":")}</span>
        <span className="mx-auto max-w-[5.5rem] text-[0.7rem] leading-tight text-muted">left to notify</span>
      </div>
    </div>
  );
}

export default function Hero() {
  const cloud = useRef<CloudHandle>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [business, setBusiness] = useState<BusinessId>("shop");
  const [incident, setIncident] = useState<IncidentId | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [why, setWhy] = useState(false);
  const touched = useRef(false);

  const scenario = incident ? SCENARIOS[business][incident] : null;
  const result = useMemo(() => (scenario ? assess(scenario) : null), [scenario]);

  const run = (b: BusinessId, i: IncidentId) => {
    const sc = SCENARIOS[b][i];
    cloud.current?.expose(sc.fields.map(kindOf), Math.min(26, 6 + Math.round(Math.log10(sc.people + 1) * 5)));
    setStartedAt(Date.now());
  };

  const choose = (i: IncidentId) => {
    touched.current = true;
    setIncident(i);
    run(business, i);
    requestAnimationFrame(() => {
      const el = panel.current;
      if (el && window.innerWidth < 1024 && el.getBoundingClientRect().top > window.innerHeight * 0.6) {
        el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      }
    });
  };

  // Play one breach on its own so first-time visitors see what happens.
  useEffect(() => {
    const t = setTimeout(() => {
      if (touched.current) return;
      setIncident("hack");
      run("shop", "hack");
    }, 1600);
    return () => clearTimeout(t);
  }, []);

  const who = scenario && (scenario.people === 1 ? "1 person" : `${scenario.people.toLocaleString("en-MY")} people`);

  return (
    <section id="try" className="relative isolate overflow-hidden bg-ink text-white">
      <DataCloud ref={cloud} className="absolute inset-0 -z-10 size-full" />
      {/* keeps the text side readable over the cloud */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,_#17213a_0%,_#17213a_34%,_rgba(23,33,58,0)_58%)]" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-28 sm:px-8 lg:min-h-screen lg:content-center lg:pb-12">
        <div className="max-w-xl">
          <h1 className="font-bold leading-[1.0] tracking-[-0.03em]" style={{ fontSize: "clamp(2.5rem, 4.8vw, 4.4rem)" }}>
            A data breach just happened. What do you do?
          </h1>
          <p className="mt-5 text-lg text-white/70">
            Every small business holds personal data. Choose a business and what went wrong, and
            see what the law asks of you.
          </p>

          <div className="mt-8 flex flex-wrap gap-1.5" role="group" aria-label="Business">
            {BUSINESSES.map((b) => (
              <button
                key={b.id}
                type="button"
                aria-pressed={b.id === business}
                onClick={() => {
                  setBusiness(b.id);
                  if (incident) run(b.id, incident);
                }}
                className={`rounded-md border px-3 py-1.5 text-[0.95rem] transition-colors ${
                  b.id === business ? "border-white bg-white text-ink" : "border-white/25 text-white/85 hover:border-white"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          <ul className="mt-4 grid grid-cols-2 gap-2.5">
            {INCIDENTS.map((it) => {
              const on = it.id === incident;
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => choose(it.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3.5 text-left font-bold leading-snug transition-[transform,border-color,background-color] duration-200 ${
                      on ? "border-stamp bg-stamp text-white" : "border-white/25 bg-white/[0.04] hover:-translate-y-0.5 hover:border-white"
                    }`}
                  >
                    {it.svg}
                    {it.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div ref={panel} className="scroll-mt-6 lg:absolute lg:bottom-10 lg:right-8 lg:w-[25rem]">
          {scenario && result ? (
            <div key={`${business}-${incident}`} className="panel-in rounded-xl bg-white p-6 text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]" aria-live="polite">
              <p className="text-sm text-muted">{who} affected</p>
              <p className="mt-1 text-xl font-bold leading-snug">{scenario.what}.</p>
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Personal data exposed">
                {scenario.fields.map((f) => (
                  <li key={f.name} className={`rounded border px-2 py-0.5 text-sm ${f.category === "other" || f.category === "contact" ? "border-rule" : "border-stamp/40 text-stamp"}`}>
                    {f.name}
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => setWhy((w) => !w)} aria-expanded={why} className="mt-3 text-sm font-bold underline decoration-rule decoration-2 underline-offset-4 hover:decoration-ink">
                {why ? "Hide the rules" : "Why? See the rules"}
              </button>
              {why && <ul className="mt-3 grid gap-1.5 text-[0.95rem]">
                {result.rules.map((r, i) => (
                  <li key={r.code} className="rule-in flex items-center gap-2.5" style={{ animationDelay: `${200 + i * 80}ms` }}>
                    <span className={`grid size-4 shrink-0 place-items-center rounded-full border text-[0.6rem] font-bold ${r.met === true ? "border-stamp bg-stamp text-white" : r.met === false ? "border-rule" : "border-dashed border-muted text-muted"}`} aria-hidden="true">
                      {r.met === true ? "✓" : r.met === null ? "?" : ""}
                    </span>
                    <span className={r.met ? "font-bold" : "text-muted"}>{r.label}</span>
                    <span className="sr-only">{r.met === true ? "met" : r.met === false ? "not met" : "needs judgement"}</span>
                  </li>
                ))}
              </ul>}
              <div className="verdict-in mt-4 flex items-center gap-4 border-t border-rule pt-4">
                {result.verdict === "register" ? (
                  <div className="grid size-32 shrink-0 place-content-center rounded-full border-[6px] border-rule text-center">
                    <span className="text-sm font-bold">No notice</span>
                    <span className="text-[0.7rem] text-muted">record only</span>
                  </div>
                ) : (
                  <Ring key={startedAt} startedAt={startedAt} urgent={result.verdict === "both"} />
                )}
                <div className="min-w-0">
                  <p className={`font-bold leading-snug ${result.verdict === "both" ? "text-stamp" : ""}`}>{VERDICT_TEXT[result.verdict].title}</p>
                  <p className="mt-1 text-sm text-muted">{VERDICT_TEXT[result.verdict].body}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/20 p-6 text-white/70">Choose what went wrong to see the answer.</div>
          )}
          <p className="mt-3 text-sm text-white/55">Fictional examples. In the real system, a person makes the final decision.</p>
        </div>
      </div>
    </section>
  );
}
