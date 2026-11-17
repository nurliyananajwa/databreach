// Chunky illustrated objects for the playground. One per incident type.
const S = { stroke: "#17213a", strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export function Laptop() {
  return (
    <svg viewBox="0 0 160 120" className="h-auto w-full" aria-hidden="true">
      <rect x="26" y="10" width="108" height="74" rx="8" fill="#cfe0ff" {...S} />
      <rect x="38" y="22" width="84" height="50" rx="3" fill="#fff" {...S} strokeWidth={4} />
      <path d="M50 38h40M50 50h56M50 62h28" {...S} strokeWidth={4} fill="none" />
      <path d="M10 92h140l-10 18H20Z" fill="#9db8f2" {...S} />
      <path d="M66 99h28" {...S} strokeWidth={4} />
    </svg>
  );
}

export function Envelope() {
  return (
    <svg viewBox="0 0 160 120" className="h-auto w-full" aria-hidden="true">
      <rect x="14" y="22" width="132" height="86" rx="10" fill="#ffe08a" {...S} />
      <path d="M18 28l62 46 62-46" fill="#fff3c4" {...S} />
      <path d="M18 104l44-36M142 104l-44-36" fill="none" {...S} strokeWidth={4} />
      <circle cx="128" cy="24" r="14" fill="#ff7a6b" {...S} strokeWidth={4} />
      <path d="M128 17v9M128 31v0" {...S} strokeWidth={4} stroke="#fff" />
    </svg>
  );
}

export function Database() {
  return (
    <svg viewBox="0 0 160 120" className="h-auto w-full" aria-hidden="true">
      {[78, 52, 26].map((y, i) => (
        <g key={y}>
          <path d={`M36 ${y}v22c0 9 20 15 44 15s44-6 44-15v-22`} fill={["#b6e3c8", "#9fd6b6", "#86c9a2"][i]} {...S} />
          <ellipse cx="80" cy={y} rx="44" ry="13" fill="#d6f2e1" {...S} />
        </g>
      ))}
      <circle cx="108" cy="66" r="4" fill="#17213a" />
      <circle cx="108" cy="92" r="4" fill="#17213a" />
    </svg>
  );
}

export function Phone() {
  return (
    <svg viewBox="0 0 160 120" className="h-auto w-full" aria-hidden="true">
      <rect x="48" y="4" width="64" height="112" rx="12" fill="#e4d7ff" {...S} />
      <rect x="57" y="18" width="46" height="80" rx="4" fill="#fff" {...S} strokeWidth={4} />
      <rect x="62" y="26" width="30" height="12" rx="6" fill="#9be2b2" {...S} strokeWidth={3} />
      <rect x="68" y="44" width="30" height="12" rx="6" fill="#fff" {...S} strokeWidth={3} />
      <rect x="62" y="62" width="26" height="12" rx="6" fill="#9be2b2" {...S} strokeWidth={3} />
      <circle cx="80" cy="106" r="3.5" fill="#17213a" />
    </svg>
  );
}
