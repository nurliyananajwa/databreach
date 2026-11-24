import Link from "next/link";

// The top of every signed-in page: continues the navy band with a big serif title.
// Pages without their own hero (Users, Inventory...) get the same look for free.
const today = new Intl.DateTimeFormat("en-MY", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" });

export default function PageHeader({ title, intro, eyebrow, big = false, ring, meta, action, children }: {
  title: string; intro?: string; eyebrow?: string; big?: boolean;
  /** Hours used on the 72-hour clock, or null for "all clear". Leave out for no ring. */
  ring?: number | null;
  /** Small status line under the intro (Home: role and status). */
  meta?: React.ReactNode;
  /** The one thing to do now: a white button under the intro. */
  action?: { href: string; label: string; urgent?: boolean; tour?: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="hub-band hub-band-page" style={{ marginTop: -1 }}>
      <div className={`hub-hero${big ? " big" : ""}`}>
        <div>
          <small>{eyebrow ?? today.format(new Date())}</small>
          <h1>{title}</h1>
          {intro && <p>{intro}</p>}
          {meta && <div className="hub-meta">{meta}</div>}
          {action && <Link href={action.href} className={`hub-cta${action.urgent ? " urgent" : ""}`} data-tour={action.tour}>{action.label}</Link>}
        </div>
        {ring !== undefined && <ClockRing used={ring} />}
        {children && <div className="actions">{children}</div>}
      </div>
    </div>
  );
}

// The glass shield inside a ring that is the live 72-hour clock: the ring
// fills as the hours pass (coral in the last day); with no incident the ring
// is calm and the label says all clear.
function ClockRing({ used }: { used: number | null }) {
  const R = 104, C = 2 * Math.PI * R;
  const h = used === null ? 0 : Math.max(0, Math.min(72, used));
  const hot = h >= 48;
  return (
    <div className="hub-ring" role="img" aria-label={used === null ? "No deadline clock running" : `${Math.floor(h)} of 72 hours used`}>
      <svg viewBox="0 0 240 240" className="hub-ring-svg">
        <circle cx="120" cy="120" r={R} fill="none" stroke="#ffffffa6" strokeWidth="12" />
        {used !== null && (
          <circle className="arc" cx="120" cy="120" r={R} fill="none" strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${(h / 72) * C} ${C}`} transform="rotate(-90 120 120)" style={{ ["--c" as string]: C, stroke: hot ? "var(--coral)" : "var(--accent-light)" }} />
        )}
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1="120" y1="8" x2="120" y2={i % 3 ? 14 : 18} stroke="#ffffffe6" strokeWidth="2" strokeLinecap="round" transform={`rotate(${i * 30} 120 120)`} />
        ))}
      </svg>
      <GlassShield />
      <span className="hub-ring-label">{used === null ? <b>All clear</b> : <><b>{Math.floor(h)}</b> of 72 h</>}</span>
    </div>
  );
}

// The glass shield with the 72-hour line running through it. Decorative.
function GlassShield() {
  return (
    <svg className="hub-shield" viewBox="62 26 136 176" aria-hidden="true">
      <defs>
        <linearGradient id="g-shield" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".98" /><stop offset=".5" style={{ stopColor: "color-mix(in srgb, var(--accent-light) 30%, #fff)" }} stopOpacity=".8" /><stop offset="1" style={{ stopColor: "var(--accent-light)" }} stopOpacity=".85" /></linearGradient>
        <radialGradient id="g-shine" cx=".3" cy=".25" r=".6"><stop offset="0" stopColor="#fff" stopOpacity=".9" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <filter id="g-glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
        <clipPath id="g-clip"><path d="M130 34 76 56v46c0 42 24 74 54 90 30-16 54-48 54-90V56Z" /></clipPath>
      </defs>
      <path d="M130 34 76 56v46c0 42 24 74 54 90 30-16 54-48 54-90V56Z" fill="url(#g-shield)" style={{ stroke: "var(--accent-light)" }} strokeWidth="2.5" />
      <path d="M130 34 76 56v46c0 42 24 74 54 90 30-16 54-48 54-90V56Z" fill="url(#g-shine)" />
      <path d="M100 62 130 50" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".9" />
      <g clipPath="url(#g-clip)">
        <path className="pulse" d="M70 128h20l10-22 14 46 14-58 12 34h50" fill="none" style={{ stroke: "var(--accent-line)" }} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" filter="url(#g-glow)" opacity=".9" />
        <path className="pulse" d="M70 128h20l10-22 14 46 14-58 12 34h50" fill="none" style={{ stroke: "var(--accent-hover)" }} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
