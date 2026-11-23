"use client";

import { useRef, useState } from "react";

export type Deadline = { type: string; due_at: string; status: string; provisional: boolean; met_at: string | null };

const when = new Intl.DateTimeFormat("en-MY", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kuala_Lumpur" });
const H = 3.6e6;

const KIND: Record<string, { title: string; who: string; rule: string }> = {
  commissioner_72h: { title: "Notify the Commissioner", who: "Compliance Officer drafts, Manager approves", rule: "Within 72 hours of becoming aware" },
  subjects_7d: { title: "Notify the people affected", who: "Only if significant harm is likely", rule: "Within 7 days after the Commissioner notice" },
  followup_30d: { title: "Send any further information", who: "Compliance Officer", rule: "Within 30 days after the Commissioner notice" },
};
const STATUS: Record<string, string> = { open: "Open", met: "Done", missed: "Missed", not_required: "Not needed" };

// The 72-hour bar you can explore: hover a bar to see that hour's time;
// click (or press Enter) to open every deadline for the incident on a timeline.
export default function ClockExplorer({ code, awareAt, deadlines }: { code: string; awareAt: string; deadlines: Deadline[] }) {
  const start = new Date(awareAt).getTime();
  const now = Date.now();
  const used = Math.max(0, Math.min(72, Math.floor((now - start) / H)));
  const [hover, setHover] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const order = ["commissioner_72h", "subjects_7d", "followup_30d"];
  const list = [...deadlines].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));

  return (
    <>
      <button
        type="button"
        className="hub-clockbar"
        onClick={() => dialog.current?.showModal()}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHover(Math.max(0, Math.min(71, Math.floor(((e.clientX - r.left) / r.width) * 72))));
        }}
        onPointerLeave={() => setHover(null)}
        aria-label={`${code}: ${used} of 72 hours used. Open all deadlines`}
      >
        <span className="hub-legend"><span>{72 - used} h left</span><span>See all deadlines →</span></span>
        <span className="hub-bars">
          {Array.from({ length: 72 }, (_, i) => (
            <i key={i} className={i < used ? (i >= 48 ? "hot" : "on") : ""} data-hover={hover === i || undefined} style={{ animationDelay: `${0.15 + i * 0.008}s` }} />
          ))}
        </span>
        {hover !== null && (
          <span className="hub-tip" style={{ left: `${((hover + 0.5) / 72) * 100}%` }} aria-hidden="true">
            <b>Hour {hover + 1}</b> {when.format(new Date(start + hover * H))}
            {hover === used && " · now"}
          </span>
        )}
      </button>

      <dialog ref={dialog} className="hub-dialog" aria-labelledby="clock-title" onClick={(e) => { if (e.target === dialog.current) dialog.current.close(); }}>
        <div className="hub-dialog-head">
          <div>
            <h2 id="clock-title">{code}: every deadline</h2>
            <p>The clock started when the business became aware of the breach. Times are Malaysia time.</p>
          </div>
          <button type="button" className="hub-go" onClick={() => dialog.current?.close()} aria-label="Close">✕</button>
        </div>
        <ol className="hub-tl">
          <li data-state="done"><i /><div><b>Became aware</b><small>{when.format(new Date(start))}</small></div></li>
          <li data-state="now"><i /><div><b>Now: hour {used}</b><small>{when.format(new Date(now))}</small></div></li>
          {list.map((d) => {
            const k = KIND[d.type] ?? { title: d.type, who: "", rule: "" };
            const state = d.status === "met" ? "done" : d.status === "missed" ? "late" : d.status === "not_required" ? "skip" : "next";
            return (
              <li key={d.type} data-state={state}>
                <i />
                <div>
                  <b>{k.title}</b>
                  <small>{d.provisional ? `${k.rule} (date fixed once that notice is sent)` : `Due ${when.format(new Date(d.due_at))}`}</small>
                  <small>{k.who}</small>
                </div>
                <span className={`hub-status ${state === "done" ? "done" : state === "late" ? "late" : state === "skip" ? "next" : "prog"}`}>{STATUS[d.status] ?? d.status}</span>
              </li>
            );
          })}
        </ol>
      </dialog>
    </>
  );
}
