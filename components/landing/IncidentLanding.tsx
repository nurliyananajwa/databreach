"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createIncidentScene, type SceneController, type SceneState } from "./incident-scene";



const example = [
  { step: "Report", question: "What happened?", text: "A customer spreadsheet was emailed to the wrong recipient. A staff member records the discovery time and identifies the information involved.", fields: [["Incident", "Misdirected customer email"], ["Discovered", "Monday, 09:15"], ["Data involved", "Names and email addresses"]] },
  { step: "Assign", question: "Who owns the response?", text: "The Compliance Officer takes ownership, coordinates containment and records the next action for the team.", fields: [["Owner", "Compliance Officer"], ["Action", "Request deletion confirmation"], ["Status", "In progress"]] },
  { step: "Track", question: "What needs attention next?", text: "The officer reviews the notification deadline alongside the incident decisions and records when each action is completed.", fields: [["Task", "Review notification decision"], ["Internal review due", "Monday, 15:00"], ["Status", "Awaiting review"]] },
];

function Brand() {
  return <Link className="brand" href="/" aria-label="Breachfolio home">
    <img src="/icon.svg" width="38" height="38" alt="" />
    <span><strong>Breachfolio</strong></span>
  </Link>;
}

export default function IncidentLanding() {
  const [selected, setSelected] = useState(0);
  const current = example[selected];
  const canvas = useRef<HTMLCanvasElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  const controller = useRef<SceneController | null>(null);
  // Readable server output also serves visitors with JavaScript unavailable.
  const [state, setState] = useState<SceneState>({ stage: 3, paused: false, reduced: false, complete: true });
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => {
    if (!canvas.current || !visual.current) return;
    const scene = createIncidentScene(canvas.current, visual.current, setState);
    controller.current = scene;
    setEnhanced(true);
    return () => { scene.dispose(); controller.current = null; };
  }, []);
  const ready = state.stage === 3;
  const motionLabel = state.reduced ? "Reduced motion on" : state.complete ? "Replay animation" : state.paused ? "Resume motion" : "Pause motion";
  return <div id="top" className="pdpa-landing" data-enhanced={enhanced}>
    <a className="skip" href="#main">Skip to content</a>
    <header className="wrap"><Brand /><Link className="outline" href="/sign-in">Sign in <span aria-hidden="true">↗</span></Link></header>
    <main id="main">
      <section className="hero wrap" aria-labelledby="hero-title" data-stage={ready ? "ready" : state.stage === 0 ? "contained" : "escaping"}>
        <div className="glass-ribbon" aria-hidden="true">
          {Array.from({ length: 44 }, (_, i) => <i key={i} style={{ transform: `translateZ(${i * 1.7}px) rotateZ(${i * 1.2}deg) scale(${1 - i * .004})` }} />)}
        </div>
        <div className="intro" onFocusCapture={() => controller.current?.finish()}>
          <h1 id="hero-title">Coordinate your<br /><span>breach response.</span></h1>
          <p className="description">Report the incident, assign a Compliance Officer and keep notification deadlines in view.</p>
          <div className="hero-actions">
            <Link className="primary" href="/sign-in">Sign in <span className="arrow" aria-hidden="true">↗</span></Link>
          </div>
          <p className="sr-only" role="status" aria-atomic="true">{ready ? "Incident reported. Officer assigned. Deadline tracked. Sign in to open your workspace." : "The opening shows data escaping, then gathering into an incident record."}</p>
        </div>
        <div className="visual" ref={visual} aria-label="Breach response illustration">
          <div className="record-leaf leaf-back" aria-hidden="true" /><div className="record-leaf leaf-front" aria-hidden="true" />
          <canvas ref={canvas} aria-hidden="true" />
          <article className="incident" aria-label="Illustrative incident record" aria-hidden={!ready}>
            <h2>Incident record</h2>
            <ul className="record-steps">
              {["Incident reported", "Officer assigned", "Deadline tracked"].map(label => <li key={label}><span className="check" aria-hidden="true">✓</span>{label}</li>)}
            </ul>
          </article>
        </div>
        <div className="hero-bottom">
          <ol className="sequence" aria-label="Animation sequence">
            {["Contained", "Breach detected", "Record assembled"].map((label, i) => <li key={label} aria-current={i === (ready ? 2 : state.stage === 0 ? 0 : 1) ? "step" : undefined}>{label}</li>)}
          </ol>
          <a className="more" href="#about">Explore a sample incident <span aria-hidden="true">↓</span></a>
          {enhanced && <button className="motion" aria-pressed={state.paused} disabled={state.reduced} onClick={() => controller.current?.toggle()}>{motionLabel}</button>}
        </div>
      </section>
      <section className="about" id="about" aria-labelledby="about-title">
        <div className="wrap case-layout">
          <div className="case-intro">
            <h2 id="about-title">Follow a sample incident.</h2>
            <p>See how a team handles a misdirected customer email, from discovery to its next deadline.</p>
            <div className="case-switch" role="group" aria-label="Response stage">
              {example.map(({ step }, index) => <button type="button" key={step} aria-pressed={index === selected} onClick={() => setSelected(index)}>{step}</button>)}
            </div>
          </div>
          <article className="case-sheet" aria-live="polite">
            <h3>{current.question}</h3>
            <p>{current.text}</p>
            <dl>{current.fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          </article>
        </div>
      </section>
    </main>
    <footer className="wrap">
      <div><strong>Breachfolio</strong><p>An IMS568 final-year assignment project. Illustrative data only. This system does not provide legal advice or send notifications.</p></div>
      <a className="top-link" href="#top">Back to top <span aria-hidden="true">↑</span></a>
    </footer>
  </div>;
}
