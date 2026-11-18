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

const CHAPTERS = [
  {label:"Exposure", title:"It starts with scattered information.", text:"A device, a document, a database. Understand what could be involved."},
  {label:"Clarity", title:"Bring the relevant data into focus.", text:"Connect the source, identify the fields and review the impact."},
  {label:"Ownership", title:"Give the next action a person.", text:"Staff, Compliance Officers and Managers move around the same incident."},
  {label:"History", title:"Keep the response in one record.", text:"The facts, the reasons and the actions belong together."},
] as const;
function DataScene({chapter, active, onSelect, motion}: {chapter:number; active:string|null; onSelect:(name:string|null)=>void; motion:boolean}) {
  const fields=["Full name","Email address","Payment details","Phone number","Identity number","Health information"];
  return <div className="bl-data-scene" data-chapter={chapter} onPointerMove={e=>{if(!motion||e.pointerType!=="mouse")return;const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty("--mx",((e.clientX-r.left)/r.width-.5)*12+"px");e.currentTarget.style.setProperty("--my",((e.clientY-r.top)/r.height-.5)*10+"px");}} onPointerLeave={e=>{e.currentTarget.style.setProperty("--mx","0px");e.currentTarget.style.setProperty("--my","0px");}}>
    <div className="bl-scene-floor" aria-hidden="true" />
    <svg className="bl-scene-lines" viewBox="0 0 1000 400" fill="none" aria-hidden="true"><ellipse cx="500" cy="228" rx="355" ry="138"/><ellipse cx="500" cy="228" rx="260" ry="98"/>{["M160 100Q340 90 500 210","M820 90Q650 100 500 210","M120 300Q330 310 500 210","M870 300Q680 300 500 210"].map(d=><path key={d} d={d} pathLength="100"/>)}</svg>
    <div className="bl-record-object" aria-hidden="true"><div className="bl-glass-layer bl-layer-back"/><div className="bl-glass-layer bl-layer-coral"/><div className="bl-record-face"><div className="bl-record-topline"><span>PDPA</span><span>01—04</span></div><div className="bl-record-glyph"><i/><i/><i/><i/></div><span className="bl-record-name">{["DATA / EXPOSED","SOURCE / LINKED","TEAM / CONNECTED","RESPONSE / RECORDED"][chapter]}</span><span className="bl-record-sub">From exposure<br/>to clarity.</span><div className="bl-record-bars"><i/><i/><i/></div></div></div>
    <div className="bl-fragment-layer">{fields.map((name,i)=><button className={'bl-fragment bl-fragment-'+i} key={name} aria-pressed={active===name} onClick={()=>onSelect(active===name?null:name)}><span className="bl-fragment-index">0{i+1}</span><span>{name}</span><span aria-hidden="true">+</span></button>)}</div>
    <div className="bl-scene-owners" aria-hidden="true">{["Staff","Compliance","Manager"].map((name,i)=><span key={name}><i>0{i+1}</i>{name}</span>)}</div>
    <div className="bl-scene-stamp" aria-hidden="true"><Icon name="record"/><span>ONE CONNECTED<br/>INCIDENT RECORD</span></div>
    <p className="bl-scene-hint" aria-live="polite">{chapter===2 ? "Three roles. One connected response." : chapter===3 ? "Facts, decisions and actions, together." : active ? active+": a field your team may need to review. Click again to close." : "Explore a data fragment"}</p>
  </div>;
}
export default function LandingExperience() {
  const [business, setBusiness] = useState<BusinessId>("shop");
  const [incident, setIncident] = useState<IncidentId>("hack");
  const [stage, setStage] = useState(0);
  const [role, setRole] = useState(1);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [motion, setMotion] = useState(true);
  const [chapter, setChapter] = useState(0);
  const [activeField, setActiveField] = useState<string|null>(null);
  const root=useRef<HTMLDivElement>(null);
  const story=useRef<HTMLElement>(null);
  useEffect(()=>{
    const preference=window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync=()=>setMotion(!preference.matches);sync();
    preference.addEventListener("change",sync);
    return()=>preference.removeEventListener("change",sync);
  },[]);
  useEffect(()=>{
    if(!motion)return;
    let frame=0;
    const update=()=>{frame=0;const el=story.current;if(!el||window.innerWidth<760)return;const r=el.getBoundingClientRect();const travel=el.offsetHeight-window.innerHeight;if(travel<=0||r.top>0||r.bottom<window.innerHeight)return;const p=Math.max(0,Math.min(1,-r.top/travel));setChapter(Math.min(3,Math.floor(p*4)));};
    const queue=()=>{if(!frame)frame=window.requestAnimationFrame(update);};
    window.addEventListener("scroll",queue,{passive:true});window.addEventListener("resize",queue);queue();
    return()=>{window.removeEventListener("scroll",queue);window.removeEventListener("resize",queue);window.cancelAnimationFrame(frame);};
  },[motion]);
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

  function toggleMotion(){if(motion&&story.current){window.scrollTo({top:window.scrollY+story.current.getBoundingClientRect().top,behavior:"instant"});}setMotion(!motion);}
  return <div ref={root} className={'breach-landing '+(motion?'':'bl-motion-off')}>
    <a className="bl-skip" href="#main">Skip to content</a>
    <header className="bl-header bl-wrap"><Link href="/" className="bl-brand"><span className="bl-brand-symbol" aria-hidden="true"><i/><i/><i/><i/></span><span>PDPA<span className="bl-brand-sub">Breach Response Tracker</span></span></Link><nav aria-label="Main"><a href="#scenario-controls">Explore the system</a><a href="#team">The people</a><Link className="bl-signin" href="/sign-in">Sign in <Icon name="arrow"/></Link></nav></header>
    <main id="main">
      <section ref={story} className="bl-story" aria-labelledby="bl-title"><div className="bl-story-sticky">
        <div className="bl-hero-heading bl-wrap"><p className="bl-eyebrow"><span className="bl-dot"/> PERSONAL DATA. HUMAN RESPONSIBILITY.</p><h1 id="bl-title">A breach happens.<br/><em>Clarity starts here.</em></h1><p className="bl-hero-subtitle">Know your data. Connect your team. Shape the response.</p></div>
        <DataScene chapter={chapter} active={activeField} onSelect={setActiveField} motion={motion}/>
        <div className="bl-story-bottom bl-wrap"><div className="bl-chapter-caption"><span className="bl-mono">0{chapter+1} / {CHAPTERS[chapter].label.toUpperCase()}</span><p>{CHAPTERS[chapter].title}</p><span>{CHAPTERS[chapter].text}</span></div><div className="bl-story-controls"><div role="group" aria-label="Explore the visual story">{CHAPTERS.map((c,i)=><button key={c.label} aria-pressed={chapter===i} onClick={()=>{setChapter(i);setActiveField(null);}}><span>0{i+1}</span>{c.label}</button>)}</div><div className="bl-story-tools"><button aria-pressed={!motion} onClick={toggleMotion}>{motion?"Pause motion":"Enable motion"}</button><a href="#scenario-controls">Try the system <Icon name="arrow"/></a></div></div></div>
        <span className="bl-scroll-label" aria-hidden="true">SCROLL TO CONNECT THE DOTS ↓</span>
      </div></section>
      <section className="bl-introduction bl-wrap"><p className="bl-eyebrow">FROM EXPOSURE TO CLARITY</p><div><h2>Less scattered information.<br/><em>More connected decisions.</em></h2><p>A personal-data inventory and breach-response workspace for Malaysian small businesses. See where data lives, understand an incident and coordinate what happens next.</p></div><a className="bl-circle-link" href="#scenario-controls" aria-label="Explore the interactive system demo"><Icon name="arrow"/></a></section>
      <div id="scenario-controls" className="bl-demo-intro bl-wrap"><div><p className="bl-eyebrow">01 / EXPLORE THE SYSTEM</p><h2>Make it<br/><em>your scenario.</em></h2><p>Choose a business and an incident. Follow the same case through the whole response.</p></div><div className="bl-demo-selector"><label htmlFor="bl-business">Your business<select id="bl-business" value={business} onChange={e=>changeScenario(e.target.value as BusinessId,incident)}>{BUSINESSES.map(b=><option key={b.id} value={b.id}>{b.label}</option>)}</select></label><div className="bl-incident-choices" role="group" aria-label="Choose an incident">{([{id:"hack",label:"Database breach"},{id:"email",label:"Misdirected email"},{id:"laptop",label:"Stolen laptop"},{id:"whatsapp",label:"Message leak"}] as const).map(item=><button key={item.id} aria-pressed={incident===item.id} onClick={()=>changeScenario(business,item.id)}><Icon name={SOURCES[item.id].icon}/><span>{item.label}</span><span aria-hidden="true">{incident===item.id?'↗':'+'}</span></button>)}</div></div></div>
      <section id="try" className="bl-explore bl-wrap bl-reveal" aria-labelledby="bl-explore-title"><div className="bl-section-heading"><div><p className="bl-eyebrow">01 / FOLLOW THE RECORD</p><h2 id="bl-explore-title">One incident.<br /><em>A clear path forward.</em></h2></div><p>Your selected incident follows four connected steps. Explore the data, assessment, team responsibilities and record.</p></div>
        <div className="bl-case-context" aria-live="polite"><span className="bl-mono">{caseCode}</span><span>{businessName}</span><strong>{scenario.what}.</strong><a className="bl-change-scenario" href="#scenario-controls">Change scenario <span aria-hidden="true">↑</span></a></div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">Step {stage + 1} of 4: {STAGES[stage].title}</p><div className="bl-stage-nav" role="group" aria-label="Explore the breach workflow">{STAGES.map((s, i) => <button key={s.title} aria-pressed={stage === i} aria-controls="bl-stage-content" onClick={() => setStage(i)}><span className="bl-stage-num">0{i + 1}</span><span><strong>{s.title}</strong><small>{s.sub}</small></span><Icon name={s.icon} /></button>)}</div>
        <div id="bl-stage-content" className="bl-stage-content" data-stage={stage} role="region" aria-label={`${STAGES[stage].title} stage`}><div className="bl-stage-copy"><p className="bl-eyebrow">{caseCode} / {STAGES[stage].title.toUpperCase()}</p><h3>{["Start with the data, wherever it lives.", "See the reasons behind the suggestion.", "A clear next step. A person responsible.", "Every decision has a place."][stage]}</h3><p>{["An inventory gives your team a starting point. Link the affected source to the incident, then confirm which personal data was actually exposed.", "The sample checks highlight what needs attention. Your Compliance Officer investigates the context and records the final notification decision.", "The report, assessment and review stay connected. Each role contributes to the response without losing sight of the same incident.", "Keep the incident details, assessment, decisions and response actions together, so the team can understand what happened and why."][stage]}</p><div className="bl-stage-callout"><Icon name={STAGES[stage].icon} /><span>{["Field names in the inventory. Customer values stay out.", "Suggestions support human judgement; they do not replace it.", "Draft approval does not send a notice or pause a deadline.", "Incident details and response history stay linked."][stage]}</span></div><div className="bl-stage-bottom"><span>0{stage + 1} <span>/ 04</span></span><button className="bl-text-link" onClick={() => {setStage((stage + 1) % 4);setRulesOpen(false);}}>{stage === 3 ? "Back to the data" : `Next: ${STAGES[stage + 1].title.toLowerCase()}`} <Icon name="arrow" /></button></div></div>
          <div className="bl-stage-preview" key={`${caseCode}-${stage}`}><div className="bl-preview-heading"><span><Icon name={STAGES[stage].icon} /> {stage === 0 ? "Linked data source" : stage === 1 ? "Assessment" : stage === 2 ? "Response plan" : "Breach register"}</span><span className="bl-mono">{caseCode}</span></div>
            {stage === 0 && <div className="bl-source-scene"><div className="bl-source-top"><span className="bl-source-icon"><Icon name={source.icon} /></span><div><strong>{source.label}</strong><span>{source.location} · {businessName}</span></div><span className="bl-status">Linked</span></div><div className="bl-data-connector" aria-hidden="true"><span />↓<span /></div><div className="bl-field-record"><div><span className="bl-eyebrow">POTENTIALLY EXPOSED</span><span>{scenario.fields.length} data types</span></div><ul className="bl-chips">{scenario.fields.map(f => <li style={{animationDelay:(scenario.fields.indexOf(f)*65)+"ms"}} className={f.category === "financial" || f.category === "sensitive" || f.category === "identity" ? "bl-chip-sensitive" : ""} key={f.name}>{f.name}</li>)}</ul><p><Icon name="people" /> {scenario.people.toLocaleString("en-MY")} {scenario.people === 1 ? "person" : "people"} affected in this example</p></div><p className="bl-preview-note">Linked fields suggest the scope. The officer confirms exposure.</p></div>}
            {stage === 1 && <div className="bl-review"><span className="bl-label">ASSESSMENT SUGGESTION</span><h4>{suggestion}</h4><p>Review the facts before deciding whether notification is required.</p><div className="bl-review-summary"><span>{scenario.people.toLocaleString("en-MY")} {peopleLabel}</span><span>{scenario.fields.length} data types</span><span>Officer review</span></div><button className="bl-rules-toggle" aria-expanded={rulesOpen} aria-controls="bl-rules" onClick={() => setRulesOpen(!rulesOpen)}>{rulesOpen ? "Hide the checks" : "See what informed this suggestion"}<span aria-hidden="true">{rulesOpen ? "−" : "+"}</span></button><p className="bl-preview-note"><Icon name="clock" /> Applicable deadlines are tracked after the relevant trigger is recorded.</p></div>}
            {stage === 2 && <div className="bl-response"><p className="bl-plan-note">Team responsibilities and next actions</p>{ROLES.map((r, i) => <div className="bl-assignment" key={r.name}><span className={`bl-avatar bl-avatar-${i}`}>{r.short}</span><div><span>{r.name}</span><strong>{r.action}</strong></div><span className="bl-assignment-index">0{i + 1}</span></div>)}<div className="bl-response-footer"><Icon name="record" /><span>One incident reference across the team.</span></div></div>}
            {stage === 3 && <div className="bl-register"><div className="bl-register-summary"><span className="bl-record-seal"><Icon name="record" /></span><div><span className="bl-mono">{caseCode}</span><h4>{businessName}</h4><p>Review pending</p></div></div><dl>{[["Incident", scenario.what],["Scope", `${scenario.people.toLocaleString("en-MY")} ${peopleLabel} · ${scenario.fields.length} data types`],["Decision", "Awaiting Compliance Officer review"],["Response history", "Actions and draft reviews belong to this record"]].map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><p className="bl-preview-note">A lasting account of the response, with reasons alongside decisions.</p></div>}
          </div>
          {stage === 1 && rulesOpen && <div id="bl-rules" className="bl-assessment-details"><div className="bl-details-heading"><h4>Why this suggestion?</h4><p>Review each criterion alongside the context of the incident.</p></div><ul className="bl-rules">{result.rules.map(r => <li key={r.code}><span className={r.met ? "bl-rule-flag" : "bl-rule-neutral"}>{r.met === true ? "!" : r.met === null ? "?" : "−"}</span><div><strong>{r.label}</strong><p>{r.why}</p></div><small>{r.met === true ? "Flagged" : r.met === null ? "Review" : "Not flagged"}</small></li>)}</ul></div>}
        </div>
      </section>

      <section id="team" className="bl-team"><div className="bl-wrap"><div className="bl-section-heading"><div><p className="bl-eyebrow">02 / THE PEOPLE</p><h2>One incident.<br/><em>A connected team.</em></h2></div><p>Everyone has a part to play. Explore how responsibility moves around the same record.</p></div><div className="bl-team-layout"><div className="bl-role-nav" role="group" aria-label="Explore team responsibilities">{ROLES.map((r,i)=><button key={r.name} aria-pressed={role===i} aria-controls="bl-role-detail" onClick={()=>setRole(i)}><span className="bl-role-number">0{i+1}</span><span>{r.name}<small>{r.state}</small></span><Icon name="arrow"/></button>)}</div><div id="bl-role-detail" className="bl-role-detail" role="region" aria-label={selectedRole.name}><p className="bl-eyebrow">{selectedRole.name.toUpperCase()}</p><h3>{selectedRole.title}</h3><p>{selectedRole.text}</p><div className="bl-role-task"><div className="bl-role-task-heading"><span>{roleWork.label}</span><span>{roleWork.status}</span></div><p className="bl-mono">{caseCode} / {businessName}</p><h4>{roleWork.task}</h4><p>{roleWork.detail}</p><ul>{roleWork.items.map(item=><li key={item}><span className="bl-task-bullet" aria-hidden="true">•</span>{item}</li>)}</ul><a href="#try" className="bl-role-case-link" onClick={()=>{setStage(role===0?0:role===1?1:2);setRulesOpen(false);}}>Explore this step <Icon name="arrow"/></a></div></div></div></div></section>
      <section className="bl-closing bl-wrap"><p className="bl-eyebrow">FROM THE FIRST REPORT TO THE FINAL RECORD</p><h2>Bring clarity<br/>to <em>what comes next.</em></h2><div><p>Your organisation's inventory, incident reports and response work, together.</p><Link className="bl-button bl-button-dark" href="/sign-in">Open your workspace <Icon name="arrow"/></Link><span className="bl-invite-note">Access is by invitation from your manager.</span></div><a className="bl-back-top" href="#main">Back to top ↑</a></section>
    </main><footer className="bl-footer bl-wrap"><span>PDPA / Breach Response Tracker</span><p>Developed as an academic project for IMS568 at UiTM. All data shown is fictional.</p></footer>
  </div>;
}
