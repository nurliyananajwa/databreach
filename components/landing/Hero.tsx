"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DataCloud, { type CloudHandle, type Kind, type Target } from "./DataCloud";
import { BUSINESSES, INCIDENTS as INCIDENT_IDS, SCENARIOS, assess, type BusinessId, type Field, type IncidentId, type Verdict } from "./scenarios";

const icon = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const INCIDENTS: { id: IncidentId; label: string; svg: React.ReactNode }[] = [
  { id: "laptop", label: "Laptop stolen", svg: <svg viewBox="0 0 32 32" className="size-6 shrink-0" {...icon}><rect x="6" y="7" width="20" height="13" rx="1.5" /><path d="M3 24h26l-2 2.5H5Z" /></svg> },
  { id: "email", label: "Email to the wrong person", svg: <svg viewBox="0 0 32 32" className="size-6 shrink-0" {...icon}><rect x="4" y="8" width="24" height="17" rx="2" /><path d="m5 10 11 8 11-8" /></svg> },
  { id: "hack", label: "Database hacked", svg: <svg viewBox="0 0 32 32" className="size-6 shrink-0" {...icon}><ellipse cx="16" cy="8" rx="10" ry="3.5" /><path d="M6 8v16c0 2 4.5 3.5 10 3.5s10-1.5 10-3.5V8M6 16c0 2 4.5 3.5 10 3.5s10-1.5 10-3.5" /></svg> },
  { id: "whatsapp", label: "WhatsApp leak", svg: <svg viewBox="0 0 32 32" className="size-6 shrink-0" {...icon}><rect x="9" y="3.5" width="14" height="25" rx="2.5" /><path d="M13 9.5h6M13 13.5h4M13 17.5h6" /></svg> },
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

const STATUS: Record<Verdict, { label: string; tone: string }> = {
  both: { label: "Notice needed", tone: "bg-stamp text-white" },
  commissioner: { label: "Notice needed", tone: "bg-ink text-white" },
  register: { label: "Record only", tone: "border border-rule text-muted" },
};

type Step = { title: string; note?: string; state: "done" | "now" | "next" };
function stepsFor(v: Verdict): Step[] {
  const head: Step[] = [
    { title: "Breach reported", note: "by staff, clock started", state: "done" },
    { title: "Assessed against the rules", note: v === "register" ? "no notice needed" : "notice needed", state: "done" },
  ];
  if (v === "register") return [...head, { title: "Record in the breach register", note: "kept for 2 years", state: "now" }];
  return [
    ...head,
    { title: "Notify the Commissioner", note: "draft waiting for manager approval", state: "now" },
    v === "both"
      ? { title: "Notify the people affected", note: "7 days after the Commissioner", state: "next" }
      : { title: "Keep in the breach register", note: "for 2 years", state: "next" },
  ];
}

const KL = new Intl.DateTimeFormat("en-MY", { timeZone: "Asia/Kuala_Lumpur", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

function Clock({ startedAt, urgent }: { startedAt: number; urgent: boolean }) {
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
    <div className="flex items-center gap-3.5">
      <div className="relative size-[5.5rem] shrink-0">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-rule)" strokeWidth="7" />
          <circle className="ring-draw" cx="60" cy="60" r="52" fill="none" stroke={urgent ? "var(--color-stamp)" : "var(--color-ink)"} strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - left / total)} />
        </svg>
        <span className="absolute inset-0 grid place-content-center text-[0.85rem] font-bold tabular-nums">{hms.join(":")}</span>
      </div>
      <div>
        <p className="text-sm text-muted">Commissioner deadline</p>
        <p className="whitespace-nowrap font-bold">{KL.format(startedAt + total * 1000)}</p>
        <p className="mt-0.5 text-sm text-muted">72 h from when you found out</p>
      </div>
    </div>
  );
}

function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(to); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const u = Math.min(1, (t - t0) / 1100);
      setN(Math.round(to * (1 - Math.pow(1 - u, 3))));
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return (
    <>
      <span aria-hidden="true">{n.toLocaleString("en-MY")}</span>
      <span className="sr-only">{to.toLocaleString("en-MY")}</span>
    </>
  );
}

export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const cloudSpot = useRef<HTMLDivElement>(null);
  const inbox = useRef<HTMLUListElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const cloud = useRef<CloudHandle>(null);
  const [business, setBusiness] = useState<BusinessId>("shop");
  const [incident, setIncident] = useState<IncidentId | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [landed, setLanded] = useState(0);
  const [why, setWhy] = useState(false);
  const [said, setSaid] = useState("");
  const touched = useRef(false);
  const fallback = useRef<ReturnType<typeof setTimeout>>(undefined);
  const spilled = useRef(1);

  const scenario = incident ? SCENARIOS[business][incident] : null;
  const result = useMemo(() => (scenario ? assess(scenario) : null), [scenario]);

  // The cloud sits where the empty slot is in the layout.
  const anchor = useCallback(() => {
    const s = section.current?.getBoundingClientRect();
    if (s && s.width < 1024) {
      // smaller screens: a faint backdrop behind the headline, no slot of its own
      return { x: s.width * 0.62, y: Math.min(300, s.width * 0.55), r: Math.min(s.width * 0.34, 260) };
    }
    const c = cloudSpot.current?.getBoundingClientRect();
    if (!s || !c || c.width === 0) return null;
    return { x: c.left - s.left + c.width / 2, y: c.top - s.top + c.height / 2, r: Math.min(c.width / 2.6, c.height / 1.4) };
  }, []);

  // Leaked pieces fly into the "Data exposed" list, if it is on screen.
  const target = useCallback((): Target | null => {
    const s = section.current?.getBoundingClientRect();
    const t = inbox.current?.getBoundingClientRect();
    const card = panel.current?.getBoundingClientRect();
    if (!s || !t || !card || t.top > window.innerHeight - 20 || t.bottom < 0) return null;
    const x = t.left - s.left + 16, y = t.top - s.top + 14;
    // pass beside the card's left edge so pieces never cross the title
    return { x, y, via: { x: Math.max(8, card.left - s.left - 160), y: y + 40 } };
  }, []);

  const run = (b: BusinessId, i: IncidentId) => {
    const sc = SCENARIOS[b][i];
    setLanded(0);
    setStartedAt(Date.now());
    const spill = Math.max(sc.fields.length + 2, Math.min(16, 4 + Math.round(Math.log10(sc.people + 1) * 3)));
    spilled.current = spill;
    // wait one frame so the new record is on the page before pieces aim at it
    requestAnimationFrame(() => cloud.current?.expose(sc.fields.map(kindOf), spill, target, () => setLanded((n) => n + 1)));
    clearTimeout(fallback.current);
    fallback.current = setTimeout(() => setLanded((n) => Math.max(n, 99)), 2600);
  };

  // one short message for screen readers, only after the visitor's own choice
  const announce = (b: BusinessId, i: IncidentId) => {
    const sc = SCENARIOS[b][i];
    const v = assess(sc).verdict;
    setSaid(
      `Incident record opened. ${sc.people.toLocaleString("en-MY")} ${sc.people === 1 ? "person" : "people"} affected. ` +
        (v === "register" ? "No notice needed, record it in the breach register." : "Notice needed. Notify the Commissioner within 72 hours."),
    );
  };

  const choose = (i: IncidentId) => {
    touched.current = true;
    setIncident(i);
    run(business, i);
    announce(business, i);
    requestAnimationFrame(() => {
      const el = panel.current;
      if (el && window.innerWidth < 1024 && el.getBoundingClientRect().top > window.innerHeight * 0.6) {
        el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      }
    });
  };

  // Play one breach on its own, once the record area is on screen (on phones
  // that is after scrolling), so first-time visitors see what happens.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const el = panel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        t = setTimeout(() => {
          if (touched.current) return;
          setIncident("hack");
          run("shop", "hack");
        }, 900);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(t); clearTimeout(fallback.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shown = scenario ? (reduce ? scenario.fields.length : Math.min(scenario.fields.length, Math.ceil((landed * scenario.fields.length) / spilled.current))) : 0;
  const biz = BUSINESSES.find((b) => b.id === business)!;
  // same format the real system gives (INC-001, INC-002 ...), varied per example
  const code = incident
    ? `INC-${String(3 + BUSINESSES.findIndex((b) => b.id === business) * 4 + INCIDENT_IDS.findIndex((x) => x.id === incident)).padStart(3, "0")}`
    : "";

  return (
    <section ref={section} id="try" className="on-dark relative isolate overflow-hidden bg-ink text-white">
      <p className="sr-only" aria-live="polite">{said}</p>
      <DataCloud ref={cloud} anchor={anchor} className="absolute inset-0 -z-10 size-full" frontClassName="pointer-events-none absolute inset-0 z-20 size-full" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-28 sm:px-8 lg:min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:items-center lg:gap-14 lg:pb-14">
        {/* left: the question and the controls */}
        <div className="relative">
          <h1 className="font-bold leading-[1.0] tracking-[-0.03em]" style={{ fontSize: "clamp(2.5rem, 4.6vw, 4.2rem)" }}>
            A data breach just happened. What do you do?
          </h1>
          <p className="mt-5 max-w-lg text-lg text-white/70">
            Pick a business and what went wrong. Watch the leaked data land in an incident record,
            with the deadline and next steps the law asks for.
          </p>

          <div className="mt-8 flex flex-wrap gap-1.5" role="group" aria-label="Business">
            {BUSINESSES.map((b) => (
              <button
                key={b.id}
                type="button"
                aria-pressed={b.id === business}
                onClick={() => {
                  touched.current = true;
                  setBusiness(b.id);
                  if (incident) { run(b.id, incident); announce(b.id, incident); }
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
                    className={`flex h-full w-full items-center gap-3 rounded-lg border p-3.5 text-left font-bold leading-snug transition-[transform,border-color,background-color] duration-200 ${
                      on ? "border-stamp bg-stamp text-white" : "border-white/25 bg-ink/60 hover:-translate-y-0.5 hover:border-white"
                    }`}
                  >
                    {it.svg}
                    {it.label}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a href="#how" className="rounded-md bg-white px-5 py-3 font-bold text-ink hover:bg-paper">
              See how the tracker works
            </a>
            <a href="#data" className="font-bold text-white/85 underline decoration-white/30 decoration-2 underline-offset-4 hover:text-white hover:decoration-white">
              What data do you hold?
            </a>
          </div>
        </div>

        {/* right: the cloud above, the record below */}
        <div className="relative">
          <div ref={cloudSpot} className="pointer-events-none hidden lg:block lg:h-60" aria-hidden="true" />

          <div ref={panel} className="relative scroll-mt-6">
            {scenario && result ? (
              <article key={`${business}-${incident}`} className="on-light panel-in overflow-hidden rounded-xl bg-white text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)]" aria-label="Incident record preview">
                <header className="flex items-center gap-3 border-b border-rule bg-paper px-5 py-2.5 text-sm">
                  <span className="font-bold">{code}</span>
                  <span className="text-muted">{biz.label}</span>
                  <span className={`ml-auto rounded px-2 py-0.5 text-xs font-bold ${STATUS[result.verdict].tone}`}>{STATUS[result.verdict].label}</span>
                </header>

                <div className="px-5 pb-5 pt-4">
                  <p className="text-xl font-bold leading-snug">{scenario.what}.</p>
                  <p className="mt-0.5 text-sm text-muted">
                    <CountUp key={startedAt} to={scenario.people} /> {scenario.people === 1 ? "person" : "people"} affected
                  </p>

                  <div className="mt-4 grid gap-5 sm:grid-cols-[minmax(0,1fr)_16rem]">
                    <div>
                      <p className="text-sm text-muted">Data exposed</p>
                      <ul ref={inbox} className="mt-1.5 flex min-h-[4.25rem] flex-wrap content-start gap-1.5" aria-label="Personal data exposed">
                        {scenario.fields.slice(0, shown).map((f) => (
                          <li key={f.name} className={`chip-in rounded border px-2 py-0.5 text-sm ${f.category === "other" || f.category === "contact" ? "border-rule" : "border-stamp/40 text-stamp"}`}>
                            {f.name}
                          </li>
                        ))}
                        {shown < scenario.fields.length && <li className="rounded border border-dashed border-rule px-2 py-0.5 text-sm text-muted" aria-hidden="true">checking…</li>}
                      </ul>
                      <button type="button" onClick={() => setWhy((w) => !w)} aria-expanded={why} className="mt-2 text-sm font-bold underline decoration-rule decoration-2 underline-offset-4 hover:decoration-ink">
                        {why ? "Hide the rules" : "Why? See the rules"}
                      </button>
                    </div>

                    <div>
                      {result.verdict === "register" ? (
                        <div>
                          <p className="text-sm text-muted">Deadline</p>
                          <p className="mt-1 font-bold">No notice needed</p>
                          <p className="mt-0.5 text-sm text-muted">Every breach is still recorded and kept for 2 years.</p>
                        </div>
                      ) : (
                        <Clock key={startedAt} startedAt={startedAt} urgent={result.verdict === "both"} />
                      )}
                    </div>
                  </div>

                  {why && (
                    <ul className="mt-4 grid gap-1.5 rounded-lg bg-paper p-3 text-[0.95rem]">
                      {result.rules.map((r, i) => (
                        <li key={r.code} className="rule-in flex items-start gap-2.5" style={{ animationDelay: `${i * 60}ms` }}>
                          <span className={`mt-1 grid size-4 shrink-0 place-items-center rounded-full border text-[0.6rem] font-bold ${r.met === true ? "border-stamp bg-stamp text-white" : r.met === false ? "border-rule bg-white" : "border-dashed border-muted text-muted"}`} aria-hidden="true">
                            {r.met === true ? "✓" : r.met === null ? "?" : ""}
                          </span>
                          <span>
                            <span className={r.met ? "font-bold" : "text-muted"}>{r.label}</span>
                            <span className="text-muted">, {r.why.charAt(0).toLowerCase() + r.why.slice(1)}</span>
                          </span>
                          <span className="sr-only">{r.met === true ? "met" : r.met === false ? "not met" : "needs judgement"}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <ol className="verdict-in mt-5 grid gap-2.5 border-t border-rule pt-4">
                    {stepsFor(result.verdict).map((st) => (
                      <li key={st.title} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[0.65rem] font-bold ${
                            st.state === "done" ? "bg-ink text-white" : st.state === "now" ? "border-2 border-stamp" : "border-2 border-rule"
                          }`}
                          aria-hidden="true"
                        >
                          {st.state === "done" ? "✓" : ""}
                        </span>
                        <p className="leading-snug">
                          <span className={st.state === "next" ? "text-muted" : "font-bold"}>{st.title}</span>
                          {st.note && <span className="text-sm text-muted">, {st.note}</span>}
                          <span className="sr-only">{st.state === "done" ? " (done)" : st.state === "now" ? " (current step)" : " (later)"}</span>
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </article>
            ) : (
              <div className="rounded-xl border border-white/20 bg-ink/60 p-6 text-white/70">Choose what went wrong to open an incident record.</div>
            )}
            <p className="mt-3 text-sm text-white/55">A preview of the tracker, with fictional data. In the real system, a person makes the final decision.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
