"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createIncidentScene, type SceneController, type SceneState } from "./incident-scene";



function Brand() {
  return <Link className="brand" href="/" aria-label="Data Breach System home">
    <span className="mark" aria-hidden="true"><i /><i /><i /><i /></span>
    <span><strong>Data Breach System</strong></span>
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
        <div className="intro" onFocusCapture={() => controller.current?.finish()}>
          <h1 id="hero-title">Manage your<br /><span>breach response.</span></h1>
          <p className="description">Report the incident, assign a Compliance Officer and keep notification deadlines in view.</p>
          <div className="hero-actions">
            <Link className="primary" href="/sign-in">Sign in <span className="arrow" aria-hidden="true">↗</span></Link>
          </div>
          <p className="sr-only" role="status" aria-atomic="true">{ready ? "Incident reported. Officer assigned. Deadline tracked. Sign in to open your workspace." : "The opening shows data escaping, then gathering into an incident record."}</p>
        </div>
        <div className="visual" ref={visual} aria-label="Breach response illustration">
          <canvas ref={canvas} aria-hidden="true" />
          <article className="incident" aria-label="Illustrative incident record" aria-hidden={!ready}>
            <h2>Incident record</h2>
            <ul className="record-steps">
              {["Incident reported", "Officer assigned", "Deadline tracked"].map(label => <li key={label}><span className="check" aria-hidden="true">✓</span>{label}</li>)}
            </ul>
          </article>
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
      <div><strong>Data Breach System</strong><p>An IMS568 final-year assignment project. Illustrative data only. This system does not provide legal advice or send notifications.</p></div>
      <a className="top-link" href="#top">Back to top <span aria-hidden="true">↑</span></a>
    </footer>
  </div>;
}
