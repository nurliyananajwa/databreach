"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createIncidentScene, type SceneController, type SceneState } from "./incident-scene";

const PHASES = [
  ["01 / Data contained", "Everything in its place."],
  ["02 / A breach breaks the boundary", "A breach creates uncertainty."],
  ["03 / Bring the response together", "Capture. Assign. Track."],
  ["04 / Ready for the next step", "One incident. A clear next step."],
] as const;

function Brand() {
  return <Link className="brand" href="/" aria-label="PDPA Breach Response Tracker home">
    <span className="mark" aria-hidden="true"><i /><i /><i /><i /></span>
    <span><strong>PDPA</strong><small>Breach Response Tracker</small></span>
  </Link>;
}

export default function IncidentLanding() {
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
        <div className="intro" onFocusCapture={event => {
          if ((event.target as HTMLElement).closest("[data-replay]")) return;
          controller.current?.finish();
        }}>
          <p className="eyebrow">A workspace for breach response</p>
          <h1 id="hero-title">A data breach.<br /><span>A clear<br />next step.</span></h1>
          <p className="description">Record incidents, coordinate your team and track notification deadlines.</p>
          <div className="hero-actions">
            <Link className="primary" href="/sign-in">Sign in <span className="arrow" aria-hidden="true">↗</span></Link>
            {enhanced && !state.reduced && <button className="replay" data-replay onClick={() => controller.current?.replay()}>Replay animation</button>}
          </div>
          <p className="sr-only" role="status" aria-atomic="true">{ready ? "Incident reported. Officer assigned. Deadline tracked. Sign in to open your workspace." : "The opening shows data escaping, then gathering into an incident record."}</p>
        </div>
        <div className="visual" ref={visual} aria-label="Breach response illustration">
          <canvas ref={canvas} aria-hidden="true" />
          <span className="story-phase" aria-hidden="true">{PHASES[state.stage][0]}</span>
          <article className="incident" aria-label="Illustrative incident record" aria-hidden={!ready}>
            <div className="record-top"><span>INCIDENT / DEMO-001</span><span>In response</span></div>
            <h2>A response, in order.</h2>
            <p className="record-note">Illustrative incident record</p>
            <ul className="record-steps">
              {["Incident reported", "Officer assigned", "Deadline tracked"].map(label => <li key={label}><span className="check" aria-hidden="true">✓</span>{label}</li>)}
            </ul>
          </article>
          <span className="tag one" aria-hidden="true">DATA / 001<b>Customer records</b></span>
          <span className="tag two" aria-hidden="true">DATA / 002<b>Contact details</b></span>
          <span className="tag three" aria-hidden="true">DATA / 003<b>Access history</b></span>
          <span className="caption" aria-hidden="true">{PHASES[state.stage][1]}</span>
        </div>
        <div className="hero-bottom">
          <a className="more" href="#about">A little about the system <span aria-hidden="true">↓</span></a>
          {enhanced && <button className="motion" aria-pressed={state.paused} disabled={state.reduced} onClick={() => controller.current?.toggle()}>{motionLabel}</button>}
        </div>
      </section>
      <section className="about" id="about" aria-labelledby="about-title">
        <div className="wrap about-inner">
          <h2 id="about-title">From the first report.<br />To the final record.</h2>
          <div className="about-copy">
            <p>Keep incident details, response tasks and decisions in one workspace. So your team can focus on what happens next.</p>
            <Link className="text-link" href="/sign-in">Go to sign in <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>
    </main>
    <footer className="wrap">
      <div><strong>PDPA Breach Response Tracker</strong><p>An IMS568 final-year assignment project. Illustrative data only. This system does not provide legal advice or send notifications.</p></div>
      <a className="top-link" href="#top">Back to top <span aria-hidden="true">↑</span></a>
    </footer>
  </div>;
}

