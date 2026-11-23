"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BUSINESSES, INCIDENTS, SCENARIOS, assess, type BusinessId, type IncidentId } from "./scenarios";
import HoursStory from "./HoursStory";

const STAGES = [
  { title: "Locate", sub: "Find the affected data", icon: "grid" },
  { title: "Review", sub: "Assess notification needs", icon: "search" },
  { title: "Respond", sub: "Assign tasks and track deadlines", icon: "people" },
  { title: "Record", sub: "Keep decisions and actions", icon: "record" },
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
  { name: "Manager", short: "MG", title: "Keep oversight.", text: "Manage team access and review any required notification drafts.", action: "Review a notification draft, if required", state: "Approve & oversee" },
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

function DataScene({motion}:{motion:boolean}) {
  const scene=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{const node=scene.current;if(!node)return;const observer=new IntersectionObserver(([entry])=>{node.dataset.visible=entry.isIntersecting?"true":"false";},{rootMargin:"80px"});observer.observe(node);return()=>observer.disconnect();},[]);
  return <div ref={scene} className="bl-data-scene" data-chapter="0" onPointerMove={e=>{if(!motion||e.pointerType!=="mouse")return;const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty("--mx",((e.clientX-r.left)/r.width-.5)*10+"px");e.currentTarget.style.setProperty("--my",((e.clientY-r.top)/r.height-.5)*8+"px");e.currentTarget.style.setProperty("--tx",((e.clientX-r.left)/r.width-.5)*18+"deg");e.currentTarget.style.setProperty("--ty",((e.clientY-r.top)/r.height-.5)*-14+"deg");}} onPointerLeave={e=>{for(const v of ["--mx","--my"])e.currentTarget.style.setProperty(v,"0px");for(const v of ["--tx","--ty"])e.currentTarget.style.setProperty(v,"0deg");}}>
    <div className="bl-scene-floor" aria-hidden="true"/>
    <div className="bl-record-object" aria-hidden="true"><div className="bl-glass-layer bl-layer-back"/><div className="bl-glass-layer bl-layer-coral"/><div className="bl-record-face"><div className="bl-record-topline"><span>PDPA</span><span>DEMO</span></div><div className="bl-record-glyph"><i/><i/><i/><i/></div><span className="bl-record-name">PERSONAL DATA</span><span className="bl-record-sub">From exposure<br/>to clarity.</span><div className="bl-record-bars"><i/><i/><i/></div></div></div>
  </div>;
}
function NotificationClock({hours,onChange,required}:{hours:number;onChange:(n:number)=>void;required:boolean}){
  return <section className="bl-deadline" aria-labelledby="bl-deadline-title"><div className="bl-deadline-heading"><Icon name="clock"/><h5 id="bl-deadline-title">{required?'Commissioner notice · timing example':'Notification timing'}</h5></div>{required?<><div className="bl-clock-readout" data-urgent={hours>=48}><strong>{72-hours}<span>hours remaining</span></strong><span>T+{hours}h elapsed</span></div><div className="bl-clock-track" aria-hidden="true"><span style={{width:hours/72*100+'%'}}/></div><div className="bl-clock-times"><span>Trigger recorded<br/><strong>Day 1 · 09:00 MYT</strong></span><span>Outer limit<br/><strong>Day 4 · 09:00 MYT</strong></span></div><label htmlFor="bl-elapsed">Explore elapsed time <output htmlFor="bl-elapsed">{hours} hours</output></label><input id="bl-elapsed" type="range" min="0" max="72" step="1" value={hours} onChange={e=>onChange(Number(e.target.value))}/><p>Notify as soon as practicable. This example shows the 72-hour outer limit after the relevant trigger is confirmed; draft review does not pause it.</p></>:<p>No notification deadline is assigned in this sample. The officer must still review the context and record the relevant trigger if notification is required.</p>}<a href="https://www.pdp.gov.my/wp-content/uploads/2025/08/GP_DBN_ENG.pdf" target="_blank" rel="noreferrer">Read the notification timing guide <span aria-hidden="true">↗</span></a></section>;
}
export default function LandingExperience() {
  const [business, setBusiness] = useState<BusinessId>("shop");
  const [incident, setIncident] = useState<IncidentId>("hack");
  const [stage, setStage] = useState(0);
  const [role, setRole] = useState(1);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [motion, setMotion] = useState(true);
  const [elapsed, setElapsed] = useState(12);
  useEffect(()=>{
    const preference=window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync=()=>setMotion(!preference.matches);sync();
    preference.addEventListener("change",sync);
    return()=>preference.removeEventListener("change",sync);
  },[]);
  const scenario = SCENARIOS[business][incident];
  const result = assess(scenario);
  const businessName = BUSINESSES.find(b => b.id === business)!.label;
  const source = SOURCES[incident];
  const caseCode = `INC-${String(3 + BUSINESSES.findIndex(b => b.id === business) * 4 + INCIDENTS.findIndex(i => i.id === incident)).padStart(3, "0")}`;
  const suggestion = result.verdict === "both" ? "Notify the Commissioner and affected people" : result.verdict === "commissioner" ? "Notify the Commissioner" : "Record the incident for further review";
  const selectedRole = ROLES[role];
  const peopleLabel = scenario.people === 1 ? "person" : "people";
  const roleTask = [
    "Capture the first report",
    "Confirm exposure and impact",
    result.verdict === "register" ? "Review the recorded decision" : "Review a notification draft",
  ][role];
  function changeScenario(b: BusinessId, i: IncidentId) { setBusiness(b); setIncident(i); setStage(0); setRulesOpen(false); setElapsed(12); }

  function toggleMotion(){setMotion(!motion);}
  const root=useRef<HTMLDivElement>(null);
  // As the hero leaves the screen, the camera "flies into" the card (--fly 0..1)
  useEffect(()=>{const el=root.current;const hero=el?.querySelector<HTMLElement>('.bl-story');if(!el||!hero)return;let raf=0;
    const update=()=>{raf=0;const b=hero.getBoundingClientRect().bottom;const p=Math.min(1,Math.max(0,(innerHeight*0.95-b)/(innerHeight*0.6)));hero.style.setProperty('--fly',p.toFixed(3));};
    const on=()=>{if(!raf)raf=requestAnimationFrame(update);};addEventListener('scroll',on,{passive:true});addEventListener('resize',on);update();
    return()=>{removeEventListener('scroll',on);removeEventListener('resize',on);cancelAnimationFrame(raf);};},[]);
  return <div ref={root} className={'breach-landing '+(motion?'':'bl-motion-off')}>
    <a className="bl-skip" href="#main">Skip to content</a>
    <header className="bl-header bl-wrap"><Link href="/" className="bl-brand" aria-label="PDPA Breach Response Tracker"><span className="bl-brand-symbol" aria-hidden="true"><i/><i/><i/><i/></span><span>PDPA<span className="bl-brand-sub">Breach Response Tracker</span></span></Link><nav aria-label="Main"><a className="bl-nav-demo" href="#scenario-controls">Try the demo</a><a href="#team">The people</a><Link className="bl-signin" href="/sign-in">Sign in <Icon name="arrow"/></Link></nav></header>
    <main id="main">
      <section className="bl-story" aria-labelledby="bl-title"><div className="bl-story-sticky">
        <div className="bl-hero-heading bl-wrap"><h1 id="bl-title">72 hours to report<br/>a data breach.<br/>Be ready.</h1><p className="bl-hero-subtitle">Know where your personal data is, decide fast, and keep the proof. Built for Malaysian SMEs.</p><div className="bl-hero-actions"><a href="#scenario-controls" className="bl-button bl-button-dark">Try the demo <Icon name="arrow"/></a></div></div>
        <DataScene motion={motion}/>
        <div className="bl-story-bottom bl-wrap"><div className="bl-story-tools"><button aria-pressed={!motion} onClick={toggleMotion}>{motion?"Pause motion":"Enable motion"}</button></div></div>
      </div></section>
      <HoursStory motion={motion}/>
      <section id="scenario-controls" className="bl-demo bl-wrap" aria-labelledby="bl-demo-title"><header className="bl-demo-heading"><div><p className="bl-eyebrow">INTERACTIVE DEMO</p><h2 id="bl-demo-title">Explore a breach scenario.</h2></div><p>Choose a business, then an incident. Follow that case through four steps.</p></header><div className="bl-demo-workspace"><div className="bl-demo-selector"><div className="bl-business-choice"><label htmlFor="bl-business">1. Choose a business</label><select id="bl-business" value={business} onChange={e=>changeScenario(e.target.value as BusinessId,incident)}>{BUSINESSES.map(b=><option key={b.id} value={b.id}>{b.label}</option>)}</select></div><div className="bl-incident-group"><p className="bl-selector-label">2. Choose an incident</p><div className="bl-incident-choices" role="group" aria-label="Choose an incident">{([{id:"hack",label:"Database breach"},{id:"email",label:"Misdirected email"},{id:"laptop",label:"Stolen laptop"},{id:"whatsapp",label:"Message leak"}] as const).map(item=><button key={item.id} aria-pressed={incident===item.id} onClick={()=>changeScenario(business,item.id)}><Icon name={SOURCES[item.id].icon}/><span>{item.label}</span><span aria-hidden="true">{incident===item.id?'↗':'+'}</span></button>)}</div></div></div>
      <section id="try" className="bl-explore" aria-label="Breach scenario workflow">
        <div className="bl-case-context" aria-live="polite"><span className="bl-mono">{caseCode}</span><span>{businessName}</span><strong>{scenario.what}.</strong><a className="bl-change-scenario" href="#scenario-controls">Change scenario <span aria-hidden="true">↑</span></a></div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">Step {stage + 1} of 4: {STAGES[stage].title}</p><div className="bl-stage-nav" role="group" aria-label="Explore the breach workflow">{STAGES.map((s, i) => <button key={s.title} aria-pressed={stage === i} aria-controls="bl-stage-content" onClick={() => setStage(i)}><span className="bl-stage-num">0{i + 1}</span><span><strong>{s.title}</strong><small>{s.sub}</small></span><Icon name={s.icon} /></button>)}</div>
        <div id="bl-stage-content" className="bl-stage-content" data-stage={stage} role="region" aria-label={`${STAGES[stage].title} stage`}><div className="bl-stage-copy"><p className="bl-eyebrow">{STAGES[stage].title.toUpperCase()}</p><h3>{["Find the affected data.", "Review the notification criteria.", "Assign the next action.", "Keep a complete incident record."][stage]}</h3><p>{["An inventory gives your team a starting point. Link the affected source to the incident, then confirm which personal data was actually exposed.", "The sample checks highlight what needs attention. Your Compliance Officer investigates the context and records the final notification decision.", "Assign response tasks, track applicable deadlines and record progress against the incident.", "Keep the incident details, assessment, decisions and response actions together, so the team can understand what happened and why."][stage]}</p><div className="bl-stage-bottom"><button className="bl-text-link" onClick={() => {setStage((stage + 1) % 4);setRulesOpen(false);}}>{stage === 3 ? "Back to the data" : `Next: ${STAGES[stage + 1].title.toLowerCase()}`} <Icon name="arrow" /></button></div></div>
          <div className="bl-stage-preview" key={`${caseCode}-${stage}`}><div className="bl-preview-heading"><span><Icon name={STAGES[stage].icon} /> {stage === 0 ? "Linked data source" : stage === 1 ? "Assessment" : stage === 2 ? "Response plan" : "Breach register"}</span><span className="bl-mono">{caseCode}</span></div>
            {stage === 0 && <div className="bl-source-scene"><div className="bl-source-top"><span className="bl-source-icon"><Icon name={source.icon} /></span><div><strong>{source.label}</strong><span>{source.location} · {businessName}</span></div><span className="bl-status">Linked</span></div><div className="bl-data-connector" aria-hidden="true"><span />↓<span /></div><div className="bl-field-record"><div><span className="bl-eyebrow">POTENTIALLY EXPOSED</span><span>{scenario.fields.length} data types</span></div><ul className="bl-chips">{scenario.fields.map(f => <li style={{animationDelay:(scenario.fields.indexOf(f)*65)+"ms"}} className={f.category === "financial" || f.category === "sensitive" || f.category === "identity" ? "bl-chip-sensitive" : ""} key={f.name}>{f.name}</li>)}</ul><p><Icon name="people" /> {scenario.people.toLocaleString("en-MY")} {scenario.people === 1 ? "person" : "people"} affected in this example</p></div><p className="bl-preview-note">Linked fields suggest the scope. The officer confirms exposure.</p></div>}
            {stage === 1 && <div className="bl-review"><span className="bl-label">ASSESSMENT SUGGESTION</span><h4>{suggestion}</h4><p>Review the facts before deciding whether notification is required.</p><div className="bl-review-summary"><span>{scenario.people.toLocaleString("en-MY")} {peopleLabel}</span><span>{scenario.fields.length} data types</span><span>Officer review</span></div><button className="bl-rules-toggle" aria-expanded={rulesOpen} aria-controls="bl-rules" onClick={() => setRulesOpen(!rulesOpen)}>{rulesOpen ? "Hide the checks" : "See what informed this suggestion"}<span aria-hidden="true">{rulesOpen ? "−" : "+"}</span></button><p className="bl-preview-note"><Icon name="clock" /> Applicable deadlines are tracked after the relevant trigger is recorded.</p></div>}
            {stage === 2 && <div className="bl-response"><p className="bl-plan-note">A response sequence for {caseCode}</p><ol className="bl-response-sequence">{[{name:"Capture the report",owner:"Staff",status:"Starting point"},{name:"Confirm exposure and decide",owner:"Compliance Officer",status:"Review needed"},{name:result.verdict==='register'?"Review the recorded decision":"Review a draft, if required",owner:"Manager",status:"After assessment"},{name:"Record actions and progress",owner:"Compliance Officer",status:"Keep the history"}].map((task,i)=><li key={task.name} data-highlight={i===(role===0?0:role===1?1:2)}><span className="bl-sequence-number">0{i+1}</span><div><strong>{task.name}</strong><span>{task.owner}</span></div><small>{task.status}</small></li>)}</ol><NotificationClock hours={elapsed} onChange={setElapsed} required={result.verdict!=='register'}/></div>}
            {stage === 3 && <div className="bl-register"><div className="bl-register-summary"><span className="bl-record-seal"><Icon name="record" /></span><div><span className="bl-mono">{caseCode}</span><h4>{businessName}</h4><p>Review pending</p></div></div><dl>{[["Incident", scenario.what],["Scope", `${scenario.people.toLocaleString("en-MY")} ${peopleLabel} · ${scenario.fields.length} data types`],["Decision", "Awaiting Compliance Officer review"],["Response history", "Actions and draft reviews belong to this record"]].map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><p className="bl-preview-note">A lasting account of the response, with reasons alongside decisions.</p></div>}
          </div>
          {stage === 1 && rulesOpen && <div id="bl-rules" className="bl-assessment-details"><div className="bl-details-heading"><h4>Why this suggestion?</h4><p>Review each criterion alongside the context of the incident.</p></div><ul className="bl-rules">{result.rules.map(r => <li key={r.code}><span className={r.met ? "bl-rule-flag" : "bl-rule-neutral"}>{r.met === true ? "!" : r.met === null ? "?" : "−"}</span><div><strong>{r.label}</strong><p>{r.why}</p></div><small>{r.met === true ? "Flagged" : r.met === null ? "Review" : "Not flagged"}</small></li>)}</ul></div>}
        </div>
      </section>

</div></section>
      <section id="team" className="bl-team"><div className="bl-wrap"><div className="bl-section-heading"><div><p className="bl-eyebrow">TEAM RESPONSIBILITIES</p><h2>Who does what?</h2></div><p>Select a role to see its part in the response.</p></div><div className="bl-team-layout"><div className="bl-role-nav" role="group" aria-label="Explore team responsibilities"><p className="bl-eyebrow">SELECT A TEAM ROLE</p>{ROLES.map((r,i)=><button key={r.name} aria-pressed={role===i} aria-controls="bl-role-detail" onClick={()=>setRole(i)}><span className="bl-role-number">0{i+1}</span><span>{r.name}<small>{r.state}</small></span><Icon name="arrow"/></button>)}</div><div key={selectedRole.name} id="bl-role-detail" className="bl-role-detail" role="region" aria-label={selectedRole.name}><p className="bl-eyebrow">{selectedRole.name.toUpperCase()}</p><h3>{selectedRole.title}</h3><p>{selectedRole.text}</p><div className="bl-role-task"><p className="bl-mono">IN THIS EXAMPLE · {caseCode} / {businessName}</p><h4>{roleTask}</h4><a href="#try" className="bl-role-case-link" onClick={()=>{setStage(role===0?0:role===1?1:2);setRulesOpen(false);}}>{role===0?"View the linked data":role===1?"View the assessment":"View the response plan"} <Icon name="arrow"/></a></div></div></div></div></section>
      <section className="bl-start" aria-labelledby="bl-start-title"><div className="bl-wrap">
        <h2 id="bl-start-title">Getting started.</h2>
        <p className="bl-start-lead">Every business gets its own private workspace. Nobody signs up alone: access always comes from someone responsible.</p>
        <ol className="bl-start-steps">
          <li><h3>Your workspace is set up.</h3><p>The system administrator creates your business workspace and its first manager account.</p></li>
          <li><h3>The manager invites the team.</h3><p>Staff and the Compliance Officer join by invitation, each with only the access their role needs.</p></li>
          <li><h3>List your data first.</h3><p>Record where personal data is kept before anything goes wrong. That is what makes 72 hours enough.</p></li>
        </ol>
        <div className="bl-start-actions">
          <Link className="bl-button bl-button-dark" href="/sign-in">Sign in to your workspace <Icon name="arrow"/></Link>
          <div className="bl-start-links"><a href="#scenario-controls">Not set up yet? Try the demo</a><a href="#main">Back to top ↑</a></div>
        </div>
      </div></section>
    </main><footer className="bl-footer bl-wrap"><span>PDPA / Breach Response Tracker</span><p>Developed as an academic project for IMS568 at UiTM. All data shown is fictional.</p></footer>
  </div>;
}
