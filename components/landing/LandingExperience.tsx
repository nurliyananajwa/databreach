"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BUSINESSES, INCIDENTS, SCENARIOS, assess, type BusinessId, type IncidentId } from "./scenarios";

const STAGES = [
  { title: "Locate", sub: "Know what is involved", icon: "grid" },
  { title: "Review", sub: "Understand the suggestion", icon: "search" },
  { title: "Respond", sub: "Give actions an owner", icon: "people" },
  { title: "Record", sub: "Keep the story together", icon: "record" },
] as const;
const SOURCES: Record<IncidentId, { label: string; location: string; icon: string }> = {
  laptop: { label: "Files on the laptop", location: "Staff device", icon: "laptop" },
  email: { label: "Shared document", location: "Email attachment", icon: "mail" },
  hack: { label: "Business records", location: "Online database", icon: "database" },
  whatsapp: { label: "Shared messages", location: "WhatsApp group", icon: "message" },
};
const ROLES = [
  { name: "Staff", short: "ST", title: "Raise the concern.", text: "Report what happened and complete assigned response tasks.", action: "Record the incident details", state: "Report & assist" },
  { name: "Compliance Officer", short: "CO", title: "Connect the facts.", text: "Confirm exposure, assess the context and document the notification decision.", action: "Review exposure and notification needs", state: "Review & coordinate" },
  { name: "Manager", short: "MG", title: "Keep oversight.", text: "Manage team access and review notification drafts before they are sent outside the system.", action: "Review a notification draft, if required", state: "Approve & oversee" },
] as const;
function Icon({ name }: { name: string }) {
  return <svg className="bl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "arrow" ? <path d="M4 12h15m-6-6 6 6-6 6" />
      : name === "grid" ? <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>
      : name === "database" ? <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0" /></>
      : name === "search" ? <><circle cx="10" cy="10" r="6.5" /><path d="m15 15 6 6M7 10h6M10 7v6" /></>
      : name === "people" ? <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v3" /></>
      : name === "mail" ? <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m3 6 9 7 9-7" /></>
      : name === "laptop" ? <><rect x="4" y="3" width="16" height="13" rx="2" /><path d="M2 20h20l-2-4H4Z" /></>
      : name === "message" ? <><path d="M21 11a9 9 0 0 1-9 9H3l1.5-5A9 9 0 1 1 21 11Z" /><path d="M8 9h8M8 13h5" /></>
      : name === "check" ? <path d="m5 12 4 4L19 6" />
      : name === "clock" ? <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>
      : <><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M9 7h6M9 11h6M9 15h4" /></>}
  </svg>;
}
export default function LandingExperience() {
  const [business, setBusiness] = useState<BusinessId>("shop");
  const [incident, setIncident] = useState<IncidentId>("hack");
  const [stage, setStage] = useState(0);
  const [role, setRole] = useState(1);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [motion, setMotion] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotion(!preference.matches);
    sync();
    preference.addEventListener("change", sync);
    const items = root.current?.querySelectorAll(".bl-reveal") ?? [];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("bl-in-view"); observer.unobserve(entry.target); } });
    }, { threshold: 0.12 });
    items.forEach(item => { item.classList.add("bl-reveal-ready"); observer.observe(item); });
    return () => { preference.removeEventListener("change", sync); observer.disconnect(); };
  }, []);
  const scenario = SCENARIOS[business][incident];
  const result = assess(scenario);
  const businessName = BUSINESSES.find(b => b.id === business)!.label;
  const source = SOURCES[incident];
  const caseCode = `INC-${String(3 + BUSINESSES.findIndex(b => b.id === business) * 4 + INCIDENTS.findIndex(i => i.id === incident)).padStart(3, "0")}`;
  const suggestion = result.verdict === "both" ? "Notification to both suggested" : result.verdict === "commissioner" ? "Commissioner notification suggested" : "Further review needed";
  const selectedRole = ROLES[role];
  const peopleLabel = scenario.people === 1 ? "person" : "people";
  const roleWork = [
    { label: "Incident report", status: "Ready for intake", task: "Capture the first report", detail: "Record when the incident was noticed and the system or document involved.", items: ["What happened and when", "The affected data source"] },
    { label: "Assessment queue", status: "Needs review", task: "Confirm exposure and impact", detail: scenario.people.toLocaleString("en-MY") + " " + peopleLabel + " and " + scenario.fields.length + " data types to review.", items: ["Confirm which data was exposed", "Record a reason for the decision"] },
    { label: result.verdict === "register" ? "Decision oversight" : "Draft review", status: "Awaiting officer review", task: result.verdict === "register" ? "Review the recorded decision" : "Review a draft when required", detail: "The officer's assessment comes first. Review the decision and any required notification draft.", items: ["Check the scope and response", "Approve a draft or return it for revision"] },
  ][role];
  function changeScenario(b: BusinessId, i: IncidentId) { setBusiness(b); setIncident(i); setStage(0); setRulesOpen(false); }
  return <div ref={root} className={`breach-landing bl-vivid ${motion ? "" : "bl-motion-off"}`}>
    <a className="bl-skip" href="#main">Skip to content</a>
    <header className="bl-header bl-wrap"><Link href="/" className="bl-brand"><span className="bl-brand-mark"><Icon name="record" /></span><span>PDPA<span className="bl-brand-sub">Breach Response Tracker</span></span></Link><nav aria-label="Main"><a href="#try">Explore the workflow</a><a href="#team">Your team</a><Link className="bl-button bl-button-dark bl-button-small" href="/sign-in">Sign in <Icon name="arrow" /></Link></nav></header>
    <main id="main">
      <section className="bl-hero bl-wrap" aria-labelledby="bl-title"><div className="bl-hero-copy"><p className="bl-eyebrow"><span className="bl-dot" /> PDPA BREACH RESPONSE TRACKER</p><h1 id="bl-title">A breach happens.<br /><em>Take the next step.</em></h1><p className="bl-intro">Personal-data inventory and breach response for Malaysian small businesses. Bring the facts, your team and the next actions into one clear record.</p><div className="bl-actions"><a className="bl-button bl-button-dark" href="#try">Explore the selected incident <Icon name="arrow" /></a><a className="bl-text-link" href="#team">Meet the response team</a></div><p className="bl-hero-note">Locate the data. Review the impact. Coordinate the response.</p></div>
        <div className="bl-hero-visual" aria-label="Interactive incident workspace">
          <div className="bl-visual-halo" aria-hidden="true" />
          <div id="scenario-controls" className="bl-primary-controls">
            <div className="bl-primary-heading"><span>Try a breach scenario</span><label htmlFor="bl-business">Business<select id="bl-business" value={business} onChange={e => changeScenario(e.target.value as BusinessId,incident)}>{BUSINESSES.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}</select></label></div>
            <div className="bl-orbit" role="group" aria-label="Choose an incident">
              {([{id:"email",label:"Misdirected email"},{id:"laptop",label:"Stolen laptop"},{id:"hack",label:"Database breach"},{id:"whatsapp",label:"Message leak"}] as const).map(item => <button key={item.id} aria-pressed={incident === item.id} onClick={() => changeScenario(business,item.id)}><Icon name={SOURCES[item.id].icon} /><span>{item.label}</span>{incident === item.id && <Icon name="check" />}</button>)}
            </div>
            <svg className="bl-flow-paths" key={caseCode} viewBox="0 0 500 64" preserveAspectRatio="none" aria-hidden="true">{([['email','M60 0C60 40 250 5 250 64'],['laptop','M185 0C185 35 250 25 250 64'],['hack','M315 0C315 35 250 25 250 64'],['whatsapp','M440 0C440 40 250 5 250 64']] as const).map(([id,d]) => <path key={id} d={d} className={incident === id ? "bl-path-active" : ""} pathLength="100" />)}</svg>
          </div>
          <div className="bl-workspace-tilt" onPointerMove={e => {if(!motion || e.pointerType !== "mouse")return;const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty("--tilt-x", ((.5-(e.clientY-r.top)/r.height)*4)+"deg");e.currentTarget.style.setProperty("--tilt-y", (((e.clientX-r.left)/r.width-.5)*5)+"deg");}} onPointerLeave={e => {e.currentTarget.style.setProperty("--tilt-x","0deg");e.currentTarget.style.setProperty("--tilt-y","0deg");}}>
            <div className="bl-workspace">
              <div className="bl-window-bar"><span className="bl-window-dots" aria-hidden="true"><i /><i /><i /></span><span>YOUR RESPONSE WORKSPACE</span><span className="bl-live-dot" /></div>
              <div className="bl-workspace-inner" key={caseCode}>
                <div className="bl-workspace-top"><span className="bl-mono">{caseCode} / {businessName.toUpperCase()}</span><span className="bl-status">Review needed</span></div>
                <h2>{scenario.what}</h2><p className="bl-workspace-caption">{source.location} → one coordinated response.</p>
                <div className="bl-workspace-stats"><div><span>People affected</span><strong>{scenario.people.toLocaleString("en-MY")}</strong></div><div><span>Data types</span><strong>{String(scenario.fields.length).padStart(2,"0")}</strong></div><div><span>Next owner</span><strong className="bl-small-stat">Compliance<br />Officer</strong></div></div>
                <ul className="bl-hero-fields" aria-label="Data fields in the selected example">{scenario.fields.map((field,i) => <li key={field.name} style={{animationDelay:(450+i*65)+"ms"}}>{field.name}</li>)}</ul>
                <div className="bl-next bl-sequence-next"><span className="bl-next-icon"><Icon name="search" /></span><div><span>NEXT ACTION</span><strong>Confirm the scope of exposure</strong></div><Icon name="arrow" /></div>
                <div className="bl-mini-flow"><span className="bl-mini-done"><Icon name="check" /> Reported</span><span className="bl-mini-current"><span className="bl-dot" /> Review</span><span>Response</span><span>Record</span></div>
              </div>
            </div>
          </div>
          <div className="bl-caption"><button className="bl-motion-toggle" aria-pressed={!motion} onClick={() => setMotion(!motion)}>{motion ? "Pause motion" : "Enable motion"}</button></div>
        </div>
      </section>
      <div className="bl-promise-strip"><div className="bl-wrap"><span><Icon name="grid" /> Know where data lives</span><span><Icon name="search" /> Explain the assessment</span><span><Icon name="people" /> Coordinate the response</span><span><Icon name="record" /> Keep the history</span></div></div>
      <section id="try" className="bl-explore bl-wrap bl-reveal" aria-labelledby="bl-explore-title"><div className="bl-section-heading"><div><p className="bl-eyebrow">01 / FOLLOW THE RECORD</p><h2 id="bl-explore-title">One incident.<br /><em>A clear path forward.</em></h2></div><p>Your selected incident follows four connected steps. Explore the data, assessment, team responsibilities and record.</p></div>
        <div className="bl-case-context" aria-live="polite"><span className="bl-mono">{caseCode}</span><span>{businessName}</span><strong>{scenario.what}.</strong><a className="bl-change-scenario" href="#scenario-controls">Change scenario <span aria-hidden="true">↑</span></a></div>
        <div className="bl-stage-nav" role="group" aria-label="Explore the breach workflow">{STAGES.map((s, i) => <button key={s.title} aria-pressed={stage === i} aria-controls="bl-stage-content" onClick={() => setStage(i)}><span className="bl-stage-num">0{i + 1}</span><span><strong>{s.title}</strong><small>{s.sub}</small></span><Icon name={s.icon} /></button>)}</div>
        <div id="bl-stage-content" className="bl-stage-content" data-stage={stage} role="region" aria-label={`${STAGES[stage].title} stage`}><div className="bl-stage-copy" key={`copy-${caseCode}-${stage}`}><p className="bl-eyebrow">{caseCode} / {STAGES[stage].title.toUpperCase()}</p><h3>{["Start with the data, wherever it lives.", "See the reasons behind the suggestion.", "A clear next step. A person responsible.", "Every decision has a place."][stage]}</h3><p>{["An inventory gives your team a starting point. Link the affected source to the incident, then confirm which personal data was actually exposed.", "The sample checks highlight what needs attention. Your Compliance Officer investigates the context and records the final notification decision.", "The report, assessment and review stay connected. Each role contributes to the response without losing sight of the same incident.", "Keep the incident details, assessment, decisions and response actions together, so the team can understand what happened and why."][stage]}</p><div className="bl-stage-callout"><Icon name={STAGES[stage].icon} /><span>{["Field names in the inventory. Customer values stay out.", "Suggestions support human judgement; they do not replace it.", "Draft approval does not send a notice or pause a deadline.", "Incident details and response history stay linked."][stage]}</span></div><div className="bl-stage-bottom"><span>0{stage + 1} <span>/ 04</span></span><button className="bl-text-link" onClick={() => {setStage((stage + 1) % 4);setRulesOpen(false);}}>{stage === 3 ? "Back to the data" : `Next: ${STAGES[stage + 1].title.toLowerCase()}`} <Icon name="arrow" /></button></div></div>
          <div className="bl-stage-preview" key={`${caseCode}-${stage}`}><div className="bl-preview-heading"><span><Icon name={STAGES[stage].icon} /> {stage === 0 ? "Linked data source" : stage === 1 ? "Assessment" : stage === 2 ? "Response plan" : "Breach register"}</span><span className="bl-mono">{caseCode}</span></div>
            {stage === 0 && <div className="bl-source-scene"><div className="bl-source-top"><span className="bl-source-icon"><Icon name={source.icon} /></span><div><strong>{source.label}</strong><span>{source.location} · {businessName}</span></div><span className="bl-status">Linked</span></div><div className="bl-data-connector" aria-hidden="true"><span />↓<span /></div><div className="bl-field-record"><div><span className="bl-eyebrow">POTENTIALLY EXPOSED</span><span>{scenario.fields.length} data types</span></div><ul className="bl-chips">{scenario.fields.map(f => <li style={{animationDelay:(scenario.fields.indexOf(f)*65)+"ms"}} className={f.category === "financial" || f.category === "sensitive" || f.category === "identity" ? "bl-chip-sensitive" : ""} key={f.name}>{f.name}</li>)}</ul><p><Icon name="people" /> {scenario.people.toLocaleString("en-MY")} {scenario.people === 1 ? "person" : "people"} affected in this example</p></div><p className="bl-preview-note">Linked fields suggest the scope. The officer confirms exposure.</p></div>}
            {stage === 1 && <div className="bl-review"><span className="bl-label">ASSESSMENT SUGGESTION</span><h4>{suggestion}</h4><p>Review the facts before deciding whether notification is required.</p><div className="bl-review-summary"><span>{scenario.people.toLocaleString("en-MY")} {peopleLabel}</span><span>{scenario.fields.length} data types</span><span>Officer review</span></div><button className="bl-rules-toggle" aria-expanded={rulesOpen} aria-controls="bl-rules" onClick={() => setRulesOpen(!rulesOpen)}>{rulesOpen ? "Hide the checks" : "See what informed this suggestion"}<span aria-hidden="true">{rulesOpen ? "−" : "+"}</span></button><p className="bl-preview-note"><Icon name="clock" /> Applicable deadlines are tracked after the relevant trigger is recorded.</p></div>}
            {stage === 2 && <div className="bl-response"><p className="bl-plan-note">Team responsibilities and next actions</p>{ROLES.map((r, i) => <div className="bl-assignment" key={r.name}><span className={`bl-avatar bl-avatar-${i}`}>{r.short}</span><div><span>{r.name}</span><strong>{r.action}</strong></div><span className="bl-assignment-index">0{i + 1}</span></div>)}<div className="bl-response-footer"><Icon name="record" /><span>One incident reference across the team.</span></div></div>}
            {stage === 3 && <div className="bl-register"><div className="bl-register-summary"><span className="bl-record-seal"><Icon name="record" /></span><div><span className="bl-mono">{caseCode}</span><h4>{businessName}</h4><p>Review pending</p></div></div><dl>{[["Incident", scenario.what],["Scope", `${scenario.people.toLocaleString("en-MY")} ${peopleLabel} · ${scenario.fields.length} data types`],["Decision", "Awaiting Compliance Officer review"],["Response history", "Actions and draft reviews belong to this record"]].map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><p className="bl-preview-note">A lasting account of the response, with reasons alongside decisions.</p></div>}
          </div>
          {stage === 1 && rulesOpen && <div id="bl-rules" className="bl-assessment-details"><div className="bl-details-heading"><h4>Why this suggestion?</h4><p>Review each criterion alongside the context of the incident.</p></div><ul className="bl-rules">{result.rules.map(r => <li key={r.code}><span className={r.met ? "bl-rule-flag" : "bl-rule-neutral"}>{r.met === true ? "!" : r.met === null ? "?" : "−"}</span><div><strong>{r.label}</strong><p>{r.why}</p></div><small>{r.met === true ? "Flagged" : r.met === null ? "Review" : "Not flagged"}</small></li>)}</ul></div>}
        </div>
      </section>
      <section id="team" className="bl-team"><div className="bl-wrap bl-team-layout bl-reveal"><div><p className="bl-eyebrow">02 / THE PEOPLE BEHIND THE RESPONSE</p><h2>Shared responsibility.<br /><em>Clear ownership.</em></h2><p>Staff, Compliance Officers and Managers work around the same incident, with access suited to their role.</p><div className="bl-role-nav" role="group" aria-label="Explore team responsibilities">{ROLES.map((r,i) => <button key={r.name} aria-pressed={role === i} aria-controls="bl-role-detail" onClick={() => setRole(i)}><span>{r.short}</span>{r.name}<Icon name="arrow" /></button>)}</div></div><div id="bl-role-detail" key={role} className="bl-role-detail" role="region" aria-label={selectedRole.name}><p className="bl-eyebrow">{selectedRole.name.toUpperCase()}</p><h3>{selectedRole.title}</h3><p>{selectedRole.text}</p><div><Icon name="check" /><span>{selectedRole.state}</span></div><div className="bl-role-task"><div className="bl-role-task-heading"><span>{roleWork.label}</span><span>{roleWork.status}</span></div><p className="bl-mono">{caseCode} / {businessName}</p><h4>{roleWork.task}</h4><p>{roleWork.detail}</p><ul>{roleWork.items.map(item => <li key={item}><span aria-hidden="true" />{item}</li>)}</ul><a href="#try" className="bl-role-case-link" onClick={() => {setStage(role === 0 ? 0 : role === 1 ? 1 : 2);setRulesOpen(false);}}>Explore this step <Icon name="arrow" /></a></div></div></div></section>
      <section className="bl-closing bl-wrap bl-reveal"><div><p className="bl-eyebrow">READY TO WORK TOGETHER?</p><h2>Bring your team<br /><em>into the response.</em></h2></div><div><p>Access your organisation’s inventory, incident reports and assigned response work.</p><Link className="bl-button bl-button-dark" href="/sign-in">Open your workspace <Icon name="arrow" /></Link><span className="bl-invite-note">Access is by invitation from your manager.</span></div></section>
    </main><footer className="bl-footer"><div className="bl-wrap"><div className="bl-footer-top"><span>PDPA / Breach Response Tracker</span><a href="#main">Back to top ↑</a></div><p>Developed as an academic project for IMS568 at UiTM. All data shown is fictional.</p></div></footer>
  </div>;
}
