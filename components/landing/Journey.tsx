"use client";

import { useState } from "react";

// Who does what, and when: the whole breach response on one chart.
// The tracker row shows what the system does on its own (it never decides).
const STAGES = [
  { when: "Before", what: "Record your data" },
  { when: "0 h", what: "Report the breach" },
  { when: "First hours", what: "Assess it" },
  { when: "Within 72 h", what: "Notify the Commissioner", key: true },
  { when: "7 days after", what: "Notify the people affected" },
  { when: "2 years", what: "Keep the record" },
];

type Lane = { id: string; who: string; acts: (string | null)[] };
const LANES: Lane[] = [
  { id: "staff", who: "Staff", acts: [null, "Reports what happened in a short form", null, "Does the tasks given, like changing passwords", null, null] },
  { id: "lead", who: "Data protection lead", acts: ["Lists where personal data is kept", null, "Confirms what was exposed and checks the rules", "Drafts the notice", "Drafts the notice to people", "Closes the incident"] },
  { id: "manager", who: "Manager", acts: ["Invites the team", null, null, "Approves the notice", "Approves the notice", null] },
  { id: "tracker", who: "The tracker", acts: [null, "Starts the 72-hour clock", "Shows each rule as met or not met", "Alerts 24 h and 6 h before the deadline", "Counts 7 days from the Commissioner notice", "Keeps a locked record and audit trail"] },
];

export default function Journey() {
  const [lane, setLane] = useState<string | null>(null);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Highlight a role">
        <span className="mr-1 text-sm text-muted">Show</span>
        {[{ id: null, who: "Everyone" }, ...LANES].map((l) => (
          <button
            key={l.who}
            type="button"
            aria-pressed={lane === l.id}
            onClick={() => setLane(l.id)}
            className={`rounded-md border px-3 py-1 text-sm transition-colors ${lane === l.id ? "border-ink bg-ink text-white" : "border-rule bg-white hover:border-ink"}`}
          >
            {l.who}
          </button>
        ))}
      </div>

      {/* wide screens: one chart, stages across, roles down */}
      <div className="mt-6 hidden overflow-hidden rounded-xl border border-rule bg-white lg:block">
        <div className="grid grid-cols-[11rem_repeat(6,minmax(0,1fr))]">
          <div className="border-b border-rule bg-paper" />
          {STAGES.map((s) => (
            <div key={s.what} className={`border-b border-l border-rule px-3 py-3 ${s.key ? "bg-stamp text-white" : "bg-paper"}`}>
              <p className={`text-sm ${s.key ? "text-white/85" : "text-muted"}`}>{s.when}</p>
              <p className="font-bold leading-snug">{s.what}</p>
            </div>
          ))}
          {LANES.map((l, li) => {
            const dim = lane !== null && lane !== l.id;
            const last = li === LANES.length - 1;
            return (
              <div key={l.id} className={`contents transition-opacity`}>
                <div className={`flex items-center px-4 py-4 font-bold transition-opacity duration-300 ${last ? "" : "border-b border-rule"} ${l.id === "tracker" ? "bg-ink text-white" : ""} ${dim ? "opacity-30" : ""}`}>
                  {l.who}
                </div>
                {l.acts.map((a, i) => (
                  <div key={i} className={`border-l border-rule px-3 py-4 text-[0.95rem] leading-snug transition-opacity duration-300 ${last ? "" : "border-b"} ${l.id === "tracker" ? "bg-ink/[0.04]" : ""} ${dim ? "opacity-30" : ""}`}>
                    {a && (
                      <span className="flex gap-2">
                        <span className={`mt-1.5 size-2 shrink-0 rounded-full ${l.id === "tracker" ? "bg-ink" : STAGES[i].key ? "bg-stamp" : "border-2 border-ink"}`} aria-hidden="true" />
                        {a}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* smaller screens: one stage at a time, top to bottom */}
      <ol className="mt-6 grid gap-3 lg:hidden">
        {STAGES.map((s, i) => (
          <li key={s.what} className={`rounded-xl border p-4 ${s.key ? "border-stamp" : "border-rule"} bg-white`}>
            <p className={`text-sm ${s.key ? "font-bold text-stamp" : "text-muted"}`}>{s.when}</p>
            <p className="text-lg font-bold">{s.what}</p>
            <ul className="mt-2 grid gap-1.5">
              {LANES.filter((l) => l.acts[i]).map((l) => (
                <li key={l.id} className={`text-[0.95rem] transition-opacity duration-300 ${lane !== null && lane !== l.id ? "opacity-30" : ""}`}>
                  <span className="font-bold">{l.who}:</span> {l.acts[i]}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <p className="mt-4 max-w-3xl text-sm text-muted">
        People make every decision; the tracker keeps time and keeps proof. Deadlines follow the
        Personal Data Protection Guideline on Data Breach Notification (2025).
      </p>
    </div>
  );
}
