"use client";

import { useState } from "react";

const day = new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kuala_Lumpur" });

// What happens in each of the four steps of a breach response.
const STEPS = [
  {
    name: "Locate",
    what: "Find what was exposed: link the incident to the data places in your inventory, then confirm which fields actually left your control.",
    who: "Staff report it; the Compliance Officer confirms",
    system: "Starts the 72-hour clock from the moment the business became aware.",
  },
  {
    name: "Assess",
    what: "Six checks: more than 1,000 people, sensitive data, financial data, risk of identity fraud, plus two questions that need judgement.",
    who: "Compliance Officer",
    system: "Suggests whether to notify and explains why. A person decides and gives a reason.",
  },
  {
    name: "Notify",
    what: "Draft the notice to the Commissioner, and to the people affected if harm is likely. The Manager approves, then it is recorded as sent.",
    who: "Compliance Officer drafts, Manager approves",
    system: "Fills in the draft from what is already known. It never sends anything itself.",
  },
  {
    name: "Record",
    what: "The facts, the decision and its reason, and every action stay together in the breach register.",
    who: "Everyone can see it; nobody can edit history",
    system: "Keeps the record for at least 2 years after the incident is closed.",
  },
] as const;

// The four steps, each one clickable to explain itself. With an incident,
// shows its progress and the date each step was done; without one, it is a
// short guide to how every breach is handled.
export default function IncidentSteps({ at, dates }: { at: number | null; dates?: (string | null)[] }) {
  const [open, setOpen] = useState(at ?? 0);
  const step = STEPS[open];

  return (
    <div className="hub-steps2">
      <div className="hub-timeline" role="tablist" aria-label="The four steps of a breach response">
        {STEPS.map((s, i) => {
          const state = at === null ? "guide" : i < at ? "done" : i === at ? "now" : "next";
          const when = dates?.[i];
          return (
            <button
              key={s.name}
              type="button"
              role="tab"
              id={`step-tab-${i}`}
              aria-selected={open === i}
              aria-controls="step-panel"
              data-state={state}
              onClick={() => setOpen(i)}
            >
              <i aria-hidden="true" />
              <b>{i + 1}. {s.name}</b>
              {at !== null && <small>{when ? day.format(new Date(when)) : i === at ? "In progress" : "Not yet"}</small>}
            </button>
          );
        })}
      </div>
      <div id="step-panel" role="tabpanel" aria-labelledby={`step-tab-${open}`} className="hub-step-panel" key={open}>
        <p>{step.what}</p>
        <dl>
          <div><dt>Who</dt><dd>{step.who}</dd></div>
          <div><dt>The system</dt><dd>{step.system}</dd></div>
        </dl>
      </div>
    </div>
  );
}
