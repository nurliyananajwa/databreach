"use client";

import { useEffect, useRef, useState } from "react";

// Scrolling = time passing. One fictional incident (INC-005, online shop)
// moves from the first report to the kept record. The card on the left is the
// same object as in the hero; it changes as each moment is reached.

type Moment = {
  hour: number; // hours since the business became aware
  when: string; // clock label
  title: string;
  body: string;
  who: string;
  card: { status: string; big: string };
};

const MOMENTS: Moment[] = [
  {
    hour: 0,
    when: "Mon 09:00 · hour 0",
    title: "A staff member spots it.",
    body: "Someone copied the customer database. The staff member reports it in a short form, and the 72-hour clock starts from the moment the business knows.",
    who: "Staff",
    card: { status: "REPORTED", big: "Reported." },
  },
  {
    hour: 3,
    when: "Mon 12:00 · hour 3",
    title: "The scattered data comes together.",
    body: "The data inventory already says what the database held. Name, email, phone, address and card details are linked to the incident: 4,800 customers.",
    who: "Compliance Officer",
    card: { status: "EXPOSURE CONFIRMED", big: "5 data types." },
  },
  {
    hour: 6,
    when: "Mon 15:00 · hour 6",
    title: "A person decides, with reasons.",
    body: "The tracker shows each notification criterion as met or not met. The officer makes the call and writes down why.",
    who: "Compliance Officer",
    card: { status: "DECISION RECORDED", big: "Notify." },
  },
  {
    hour: 48,
    when: "Wed 09:00 · hour 48",
    title: "24 hours left. Nobody forgets.",
    body: "The tracker alerts the officer and the manager. The notice draft is waiting for approval, and the clock keeps running while it waits.",
    who: "The tracker, then Manager",
    card: { status: "AWAITING APPROVAL", big: "24 h left." },
  },
  {
    hour: 54,
    when: "Wed 15:00 · hour 54",
    title: "Sent, with 18 hours to spare.",
    body: "The manager approves the draft. The officer records when it was sent to the Commissioner. The people affected are told within the next 7 days.",
    who: "Manager and Compliance Officer",
    card: { status: "COMMISSIONER NOTIFIED", big: "On time." },
  },
  {
    hour: 54,
    when: "Kept for 2 years",
    title: "If anyone asks, the proof is there.",
    body: "Every report, decision, approval and date stays in one locked record with a full history. Nothing has to be rebuilt from WhatsApp chats.",
    who: "Everyone",
    card: { status: "RECORD LOCKED", big: "Kept." },
  },
];

const FIELDS = ["Name", "Email", "Phone", "Address", "Card details"];
const DAYS = ["Mon", "Tue", "Wed", "Thu"];
const clockAt = (h: number) => {
  const total = 9 + h; // the story starts Monday 09:00
  return `${DAYS[Math.floor(total / 24)] ?? "Thu"} ${String(Math.floor(total % 24)).padStart(2, "0")}:00`;
};

export default function HoursStory({ motion }: { motion: boolean }) {
  const root = useRef<HTMLElement>(null);
  const steps = useRef<(HTMLElement | null)[]>([]);
  const hoursOut = useRef<HTMLSpanElement>(null);
  const leftOut = useRef<HTMLSpanElement>(null);
  const timeOut = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);

  // One passive scroll listener, only while the section is on screen. It
  // writes the running clock straight to the page (no re-render per frame).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let raf = 0;
    let onScreen = false;
    let shown = "";
    const update = () => {
      raf = 0;
      // a moment becomes active when its title reaches just past the middle of the screen
      const mid = window.innerHeight * 0.55;
      const tops = steps.current.map((s) => (s ? s.getBoundingClientRect().top + 60 : Infinity));
      let i = 0;
      while (i < tops.length - 1 && tops[i + 1] <= mid) i++;
      const a = MOMENTS[i], b = MOMENTS[Math.min(i + 1, MOMENTS.length - 1)];
      const span = tops[i + 1] - tops[i];
      const t = i < tops.length - 1 && span > 0 ? Math.min(1, Math.max(0, (mid - tops[i]) / span)) : 0;
      // hold on this moment's hour while its text is being read (first 55%),
      // then run quickly to the next moment's hour in the gap before it
      const run = Math.min(1, Math.max(0, (t - 0.55) / 0.45));
      const eased = run * run * (3 - 2 * run);
      const h = Math.round(a.hour + (b.hour - a.hour) * eased);
      el.style.setProperty("--hours", String(h / 72));
      el.dataset.urgent = h >= 48 && i < 4 ? "true" : "false";
      // the clock only ever measures the 72-hour deadline: once the notice is
      // sent it stops at hour 54 and stays there (the 2 years is told by the text)
      const key = `${h}|${i}`;
      if (key !== shown) {
        shown = key;
        const done = i >= 4;
        if (hoursOut.current) hoursOut.current.textContent = String(h);
        if (leftOut.current) leftOut.current.textContent = done ? "Done: 18 hours to spare" : `${72 - h} hours left`;
        if (timeOut.current) timeOut.current.textContent = done ? "✓ Clock stopped at Wed 15:00" : clockAt(h);
      }
      setActive((cur) => (cur === i ? cur : i));
    };
    const onScroll = () => { if (onScreen && !raf) raf = requestAnimationFrame(update); };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) onScroll(); });
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const m = MOMENTS[active];

  return (
    <section ref={root} className={`bl-hours${motion ? "" : " bl-hours-still"}`} aria-labelledby="bl-hours-title" data-moment={active}>
      <div className="bl-wrap bl-hours-intro">
        <h2 id="bl-hours-title">What the 72 hours look like.</h2>
        <div>
          <p>Scroll through one fictional breach, from the first report to the kept record. Watch the clock.</p>
          <a className="bl-hours-skip" href="#scenario-controls">Skip to the demo <span aria-hidden="true">↓</span></a>
        </div>
      </div>

      <div className="bl-wrap bl-hours-grid">
        {/* the stage stays in view while the moments scroll past */}
        <div className="bl-hours-stage">
          <div className="bl-hours-clock" aria-hidden="true">
            <div className="bl-hours-readout">
              <span className="bl-hours-big"><span ref={hoursOut}>0</span><small>h</small></span>
              <span className="bl-hours-meta">
                <span ref={timeOut}>Mon 09:00</span>
                <strong ref={leftOut}>72 hours left</strong>
              </span>
            </div>
            <div className="bl-hours-rail">
              <span className="bl-hours-fill" />
              <span className="bl-hours-sent" style={{ left: `${(54 / 72) * 100}%` }}>Sent</span>
              {[0, 24, 48, 72].map((h) => (
                <i key={h} style={{ left: `${(h / 72) * 100}%` }}><b>{h}h</b></i>
              ))}
            </div>
          </div>

          <div className="bl-hours-card-zone" aria-hidden="true">
            <ul className="bl-hours-chips">
              {FIELDS.map((f, i) => <li key={f} className={`bl-hours-chip bl-hours-chip-${i}`}>{f}</li>)}
            </ul>
            <div className="bl-hours-card">
              <div className="bl-glass-layer bl-layer-back" />
              <div className="bl-glass-layer bl-layer-coral" />
              <div className="bl-record-face">
                <div className="bl-record-topline"><span>INC-005</span><span>DEMO</span></div>
                <div className="bl-record-glyph"><i /><i /><i /><i /></div>
                <span className="bl-record-name" key={`s${active}`}>{m.card.status}</span>
                <span className="bl-record-sub bl-hours-cardtext" key={`b${active}`}>{m.card.big}</span>
                <div className="bl-record-bars"><i /><i /><i /></div>
              </div>
              <span className="bl-hours-stamp">Sent to the Commissioner</span>
            </div>
          </div>
        </div>

        <ol className="bl-hours-steps">
          {MOMENTS.map((s, i) => (
            <li key={s.title} ref={(n) => { steps.current[i] = n; }} className="bl-hours-step" data-on={i === active}>
              <p className="bl-hours-when">{s.when}</p>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <p className="bl-hours-who">{s.who}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
