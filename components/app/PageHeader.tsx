// The top of every signed-in page: continues the pale band with a big, light title.
// Pages without their own hero (Users, Inventory...) get the same look for free.
const today = new Intl.DateTimeFormat("en-MY", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" });

export default function PageHeader({ title, intro, eyebrow, big = false, art = false, children }: {
  title: string; intro?: string; eyebrow?: string; big?: boolean; art?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className="hub-band hub-band-page" style={{ marginTop: -1 }}>
      {art && <GlassArt />}
      <div className={`hub-hero${big ? " big" : ""}`}>
        <div>
          <small>{eyebrow ?? today.format(new Date())}</small>
          <h1>{title}</h1>
          {intro && <p>{intro}</p>}
        </div>
        {children && <div className="actions">{children}</div>}
      </div>
    </div>
  );
}

// A glass shield with the 72-hour line running through it, a data record
// behind it and the deadline clock beside it. Decorative only.
function GlassArt() {
  return (
    <div className="hub-glass" aria-hidden="true">
      <svg viewBox="0 0 260 250">
        <defs>
          <linearGradient id="g-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".95" /><stop offset=".55" stopColor="#dfe6ff" stopOpacity=".55" /><stop offset="1" stopColor="#8fa6ff" stopOpacity=".55" /></linearGradient>
          <linearGradient id="g-shield" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".98" /><stop offset=".5" stopColor="#c9d5ff" stopOpacity=".8" /><stop offset="1" stopColor="#5f7cff" stopOpacity=".85" /></linearGradient>
          <linearGradient id="g-coral" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffc1b2" /><stop offset="1" stopColor="#ff6b4d" /></linearGradient>
          <radialGradient id="g-shine" cx=".3" cy=".25" r=".6"><stop offset="0" stopColor="#fff" stopOpacity=".9" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
          <filter id="g-glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        {/* record sheet, tilted behind */}
        <g transform="rotate(-12 70 120)">
          <rect x="18" y="58" width="96" height="124" rx="16" fill="url(#g-glass)" stroke="#fff" strokeWidth="1.5" />
          <rect x="34" y="84" width="52" height="6" rx="3" fill="#fff" opacity=".9" />
          <rect x="34" y="100" width="64" height="5" rx="2.5" fill="#fff" opacity=".7" />
          <rect x="34" y="114" width="44" height="5" rx="2.5" fill="#fff" opacity=".6" />
          <rect x="34" y="128" width="58" height="5" rx="2.5" fill="#ff8a70" opacity=".8" />
        </g>
        {/* deadline clock */}
        <g transform="translate(206 66)">
          <circle r="34" fill="url(#g-glass)" stroke="#fff" strokeWidth="1.5" />
          <circle r="25" fill="none" stroke="#ffffff99" strokeWidth="6" />
          <circle r="25" fill="none" stroke="url(#g-coral)" strokeWidth="6" strokeLinecap="round" strokeDasharray="118 157" transform="rotate(-90)" />
          <path d="M0 -12 V0 L8 6" stroke="#13206b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>
        {/* shield */}
        <path d="M130 34 76 56v46c0 42 24 74 54 90 30-16 54-48 54-90V56Z" fill="url(#g-shield)" stroke="#fff" strokeWidth="2" />
        <path d="M130 34 76 56v46c0 42 24 74 54 90 30-16 54-48 54-90V56Z" fill="url(#g-shine)" />
        <path d="M100 62 130 50" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".9" />
        {/* the running 72-hour line */}
        <path className="pulse" d="M20 128h70l10-22 14 46 14-58 12 34h100" fill="none" stroke="#2855ff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" filter="url(#g-glow)" opacity=".7" />
        <path className="pulse" d="M20 128h70l10-22 14 46 14-58 12 34h100" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* small glass beads */}
        <circle cx="48" cy="200" r="10" fill="url(#g-glass)" stroke="#fff" />
        <circle cx="226" cy="168" r="7" fill="url(#g-coral)" opacity=".85" />
        <circle cx="196" cy="214" r="12" fill="url(#g-glass)" stroke="#fff" />
      </svg>
    </div>
  );
}
