"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BUSINESSES, SCENARIOS, VERDICT_TEXT, assess, type BusinessId, type IncidentId } from "./scenarios";
import Mascot, { type Mood } from "./Mascot";
import { Database, Envelope, Laptop, Phone } from "./Objects";

const OBJECTS: { id: IncidentId; label: string; Art: () => React.ReactElement; spot: string; delay: string }[] = [
  { id: "laptop", label: "Laptop stolen", Art: Laptop, spot: "lg:left-[2%] lg:top-[6%]", delay: "0s" },
  { id: "email", label: "Email to the wrong person", Art: Envelope, spot: "lg:right-[2%] lg:top-[2%]", delay: "-1.4s" },
  { id: "hack", label: "Database hacked", Art: Database, spot: "lg:left-[6%] lg:bottom-[2%]", delay: "-2.6s" },
  { id: "whatsapp", label: "WhatsApp leak", Art: Phone, spot: "lg:right-[6%] lg:bottom-[0%]", delay: "-0.8s" },
];

const BG: Record<Mood, string> = {
  idle: "#efe9ff",
  calm: "#d9f2e4",
  alert: "#e2e0fb",
  worried: "#fde0e3",
};

function Countdown({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, 72 * 3600 - Math.floor((now - startedAt) / 1000));
  return (
    <span className="tabular-nums">
      {[Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60].map((n) => String(n).padStart(2, "0")).join(":")}
    </span>
  );
}

export default function Playground() {
  const [business, setBusiness] = useState<BusinessId>("shop");
  const [incident, setIncident] = useState<IncidentId | null>(null);
  const [bump, setBump] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [why, setWhy] = useState(false);
  const answer = useRef<HTMLDivElement>(null);

  // On small screens the answer sits below the objects: bring it into view.
  const showAnswer = () => {
    requestAnimationFrame(() => {
      const el = answer.current;
      if (!el || window.innerWidth >= 1024) return;
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      }
    });
  };

  const scenario = incident ? SCENARIOS[business][incident] : null;
  const result = useMemo(() => (scenario ? assess(scenario) : null), [scenario]);
  const mood: Mood = !result ? "idle" : result.verdict === "both" ? "worried" : result.verdict === "commissioner" ? "alert" : "calm";

  const breakIt = (id: IncidentId) => {
    setIncident(id);
    setBump((b) => b + 1);
    setStartedAt(Date.now());
    showAnswer();
  };
  const pickBusiness = (id: BusinessId) => {
    setBusiness(id);
    if (incident) {
      setBump((b) => b + 1);
      setStartedAt(Date.now());
    }
  };

  const who = scenario && (scenario.people === 1 ? "1 person" : `${scenario.people.toLocaleString("en-MY")} people`);

  return (
    <section
      id="try"
      className="relative isolate overflow-hidden px-5 pb-16 pt-24 transition-colors duration-700 sm:px-8 lg:min-h-screen lg:pb-10"
      style={{ backgroundColor: BG[mood] }}
    >
      {/* soft colour blobs (gradients, not blur filters, so they cost nothing) */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -left-40 -top-40 size-[36rem] rounded-full bg-[radial-gradient(circle,_#ffd6e7_0%,_transparent_68%)]" />
        <div className="absolute -bottom-48 -right-32 size-[40rem] rounded-full bg-[radial-gradient(circle,_#c9f1dc_0%,_transparent_68%)]" />
        <div className="absolute left-1/2 top-1/3 size-[30rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_#ffffffcc_0%,_transparent_70%)]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h1 className="mx-auto max-w-4xl font-bold leading-[0.98] tracking-[-0.03em]" style={{ fontSize: "clamp(2.6rem, 5.4vw, 4.6rem)" }}>
            Oops. Something just leaked.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink/75">
            Pick your business, then click something to break it. Our shield tells you what the law
            asks you to do.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2" role="group" aria-label="Your business">
            {BUSINESSES.map((b) => (
              <button
                key={b.id}
                type="button"
                aria-pressed={b.id === business}
                onClick={() => pickBusiness(b.id)}
                className={`rounded-full border-[2.5px] border-ink px-4 py-1.5 font-bold transition-transform hover:-translate-y-0.5 ${
                  b.id === business ? "bg-ink text-white" : "bg-white text-ink"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mx-auto mt-8 grid max-w-6xl gap-6 lg:mt-2 lg:block lg:h-[31rem]">
          {/* objects: a 2x2 grid on phones, floating around the shield on desktop */}
          <ul className="grid grid-cols-2 gap-4 lg:contents">
            {OBJECTS.map(({ id, label, Art, spot, delay }) => {
              const on = incident === id;
              return (
                <li key={id} className={`lg:absolute ${spot} lg:w-48`}>
                  <button
                    type="button"
                    onClick={() => breakIt(id)}
                    aria-pressed={on}
                    className={`obj-float group relative block w-full rounded-[2rem] border-[3px] border-ink bg-white p-4 text-center shadow-[6px_6px_0_#17213a] transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[8px_10px_0_#17213a] active:translate-y-0.5 active:shadow-[3px_3px_0_#17213a] ${
                      on ? "ring-4 ring-[#ff7a6b] ring-offset-2" : ""
                    }`}
                    style={{ animationDelay: delay }}
                  >
                    <span className="block transition-transform duration-300 group-hover:rotate-[-4deg] group-hover:scale-105">
                      <Art />
                    </span>
                    <span className="mt-2 block font-bold leading-tight">{label}</span>
                    {on && scenario && (
                      <span key={`${bump}`} className="pointer-events-none absolute inset-0" aria-hidden="true">
                        {scenario.fields.map((f, i) => (
                          <span
                            key={f.name}
                            className="burst absolute left-1/2 top-1/3 whitespace-nowrap rounded-full border-2 border-ink bg-white px-2 py-0.5 text-xs font-bold"
                            style={{
                              ["--dx" as string]: `${Math.cos((i / scenario.fields.length) * Math.PI * 2 - 1) * 120}px`,
                              ["--dy" as string]: `${Math.sin((i / scenario.fields.length) * Math.PI * 2 - 1) * 90 - 40}px`,
                              animationDelay: `${i * 40}ms`,
                            }}
                          >
                            {f.name}
                          </span>
                        ))}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* the shield and its speech bubble */}
          <div ref={answer} className="relative mx-auto grid max-w-md justify-items-center lg:absolute lg:left-1/2 lg:top-0 lg:w-[26rem] lg:-translate-x-1/2">
            <div className="w-36 sm:w-44">
              <Mascot mood={mood} bump={bump} />
            </div>

            <div
              key={`${business}-${incident}`}
              className="bubble relative mt-3 w-full rounded-[1.75rem] border-[3px] border-ink bg-white p-5 text-left shadow-[6px_6px_0_#17213a]"
              aria-live="polite"
            >
              <span className="absolute -top-[13px] left-1/2 size-6 -translate-x-1/2 rotate-45 border-l-[3px] border-t-[3px] border-ink bg-white" aria-hidden="true" />
              {!scenario || !result ? (
                <p className="relative text-center text-lg font-bold">Click the laptop, envelope, phone or database to cause a breach.</p>
              ) : (
                <div className="relative">
                  <p className="text-sm font-bold text-ink/60">{who} exposed</p>
                  <p className="mt-1 text-xl font-bold leading-snug">{scenario.what}.</p>
                  <div
                    className={`mt-3 rounded-2xl border-[2.5px] border-ink px-4 py-3 ${
                      result.verdict === "both" ? "bg-[#ff7a6b]" : result.verdict === "commissioner" ? "bg-[#c9c4ff]" : "bg-[#9be2b2]"
                    }`}
                  >
                    <p className="font-bold leading-snug">{VERDICT_TEXT[result.verdict].title}</p>
                    {result.verdict !== "register" ? (
                      <p className="mt-1 flex items-baseline justify-between gap-2 text-sm">
                        <span>Time left to tell the Commissioner</span>
                        <span className="text-lg font-bold"><Countdown key={startedAt} startedAt={startedAt} /></span>
                      </p>
                    ) : (
                      <p className="mt-1 text-sm">{VERDICT_TEXT.register.body}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setWhy((w) => !w)}
                    aria-expanded={why}
                    className="mt-3 text-sm font-bold underline decoration-2 underline-offset-4"
                  >
                    {why ? "Hide the rules" : "Why?"}
                  </button>
                  {why && (
                    <ul className="mt-2 grid gap-1.5 text-sm">
                      {result.rules.map((r) => (
                        <li key={r.code} className="flex items-start gap-2">
                          <span
                            className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-ink text-[0.7rem] font-bold ${
                              r.met === true ? "bg-[#ff7a6b]" : r.met === false ? "bg-white" : "bg-[#ffe08a]"
                            }`}
                            aria-hidden="true"
                          >
                            {r.met === true ? "!" : r.met === false ? "–" : "?"}
                          </span>
                          <span>
                            <span className="font-bold">{r.label}:</span> {r.why}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <p className="mt-3 text-center text-xs text-ink/60">Examples only. In the real system, a person makes the final decision.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
