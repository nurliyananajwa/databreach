"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import Icon from "@/components/app/hub/icons";
import { INCIDENT_TYPES, TYPE_LABEL, type IncidentType } from "@/lib/incidents";
import { looksLikeRealData } from "@/lib/inventory";
import { reportBreach, type ReportState } from "./actions";

const KL = "Asia/Kuala_Lumpur";
function nowKL() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: KL, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { date: `${g("year")}-${g("month")}-${g("day")}`, time: `${g("hour") === "24" ? "00" : g("hour")}:${g("minute")}` };
}

export default function ReportForm({ sets, followHref }: { sets: { id: string; name: string }[]; followHref: string }) {
  const [state, action, pending] = useActionState<ReportState, FormData>(reportBreach, {});
  const [f, setF] = useState({ title: "", description: "", date: "", time: "", type: "" as IncidentType | "", sets: [] as string[] });
  const [sentKey, setSentKey] = useState<string | null>(null);
  const today = nowKL().date;

  // Read the date back in words, in Malaysian time: the boxes follow the
  // browser's language, which can show American order (11/24/2026, 11:47 PM).
  const when = (() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date) || !/^\d{2}:\d{2}$/.test(f.time)) return null;
    const at = new Date(`${f.date}T${f.time}:00+08:00`);
    if (Number.isNaN(at.getTime())) return null;
    const fmt = new Intl.DateTimeFormat("en-MY", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: KL });
    return { found: fmt.format(at), due: fmt.format(new Date(at.getTime() + 72 * 3.6e6)) };
  })();

  // A warning only: a report must never be blocked when the clock is running,
  // but people are reminded not to paste the personal data itself.
  const realData = looksLikeRealData(f.title) || looksLikeRealData(f.description);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };

  if (state.sent && sentKey !== state.sent.id) {
    return (
      <section className="hub-card rep-sent" aria-live="polite">
        <span className="ic"><Icon name="check" /></span>
        <p className="code">{state.sent.code}</p>
        <h2>Report sent</h2>
        <p>The Compliance Officer has been told. The 72-hour clock counts from the time you gave, so they will start straight away.</p>
        <div className="rep-sent-actions">
          <Link href={followHref} className="hub-btn">{followHref === "/my-reports" ? "Follow it in My reports" : "Open the incidents"}</Link>
          <button type="button" className="hub-btn soft" onClick={() => { setSentKey(state.sent!.id); setF({ title: "", description: "", date: "", time: "", type: "", sets: [] }); }}>Report another</button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="hub-card rep-form">
      <fieldset className="rep-step">
        <legend><span className="n">1</span>What happened</legend>
        <label className="sr-only" htmlFor="rep-title">One-line summary</label>
        <input id="rep-title" name="title" required minLength={3} maxLength={160} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })}
          placeholder="In one line, for example: Payroll file sent to the wrong client" />
        <label className="sr-only" htmlFor="rep-desc">What happened, in more detail</label>
        <textarea id="rep-desc" name="description" required minLength={10} maxLength={4000} rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })}
          placeholder="Describe what happened and what you have done so far. Don't paste the personal data itself." />
        {realData && <p className="rep-warn" role="status"><Icon name="lock" className="size-4" />This looks like it contains real personal data (an IC number, phone number or email). Please describe it instead, for example &ldquo;the client&rsquo;s email address&rdquo;.</p>}
      </fieldset>

      <fieldset className="rep-step">
        <legend><span className="n">2</span>When the business found out</legend>
        <div className="rep-when">
          <label><span className="sr-only">Date</span><input type="date" name="date" required max={today} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
          <label><span className="sr-only">Time</span><input type="time" name="time" required value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></label>
          <button type="button" className="hub-btn soft" onClick={() => setF({ ...f, ...nowKL() })}>Just now</button>
        </div>
        {when ? (
          <p className="rep-when-read" role="status">
            Found out <b>{when.found}</b>. The Commissioner must be told by <b>{when.due}</b>.
          </p>
        ) : <p className="rep-hint">The 72-hour clock counts from this time, not from when you send the report. Malaysian time.</p>}
      </fieldset>

      <fieldset className="rep-step">
        <legend><span className="n">3</span>What kind of breach</legend>
        <div className="rep-types">
          {INCIDENT_TYPES.map((t) => (
            <label key={t} className={f.type === t ? "on" : undefined}>
              <input type="radio" name="type" value={t} required checked={f.type === t} onChange={() => setF({ ...f, type: t })} />
              {TYPE_LABEL[t]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="rep-step">
        <legend><span className="n">4</span>Which data might be involved <span className="opt">(optional)</span></legend>
        {sets.length ? (
          <div className="rep-sets">
            {sets.map((s) => {
              const on = f.sets.includes(s.id);
              return (
                <label key={s.id} className={on ? "on" : undefined}>
                  <input type="checkbox" name="sets" value={s.id} checked={on}
                    onChange={() => setF({ ...f, sets: on ? f.sets.filter((x) => x !== s.id) : [...f.sets, s.id] })} />
                  {s.name}
                </label>
              );
            })}
          </div>
        ) : <p className="rep-hint">No data sets are listed yet. Describe the data in step 1 instead.</p>}
        <p className="rep-hint">Not sure? Leave it. The Compliance Officer will check.</p>
      </fieldset>

      <div className="inv-actions">
        <button type="submit" className="hub-btn" disabled={pending} aria-busy={pending}>{pending ? "Sending…" : "Send report"}</button>
        {state.error && <p role="alert" className="hub-msg-err">{state.error}</p>}
      </div>
    </form>
  );
}
