// Small line icons used across the app (stroke = currentColor).
const P = {
  home: <><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" /><rect x="4" y="14" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" /></>,
  alert: <><path d="M12 4 3 20h18L12 4Z" /><path d="M12 10v4M12 17v.5" /></>,
  db: <><ellipse cx="12" cy="6" rx="7" ry="2.5" /><path d="M5 6v12c0 1.4 3 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 3 2.5 7 2.5s7-1.1 7-2.5" /></>,
  check: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  book: <><path d="M5 5h10a4 4 0 0 1 4 4v10H9a4 4 0 0 1-4-4V5Z" /><path d="M9 9h6M9 13h4" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.5M18 19a5 5 0 0 0-2.5-4.3" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  person: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  plus: <><circle cx="12" cy="12" r="8" /><path d="M12 8v8M8 12h8" /></>,
  inbox: <><path d="M4 13h4l2 3h4l2-3h4" /><path d="M5 6h14l1 7v5H4v-5l1-7Z" /></>,
  stamp: <><path d="M9 4h6l-1 7h-4L9 4Z" /><path d="M5 15h14v3H5zM6 21h12" /></>,
  log: <><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" /></>,
  chart: <><path d="M4 20h16M7 16v-5M12 16V8M17 16v-8" /></>,
  list: <><path d="M9 6h11M9 12h11M9 18h11M4 6h.5M4 12h.5M4 18h.5" /></>,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  arrow: <path d="M7 17 17 7M9 7h8v8" />,
  chev: <path d="m9 6 6 6-6 6" />,
  exit: <><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9" /></>,
  pen: <path d="M4 20h4L19 9l-4-4L4 16v4ZM13 7l4 4" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></>,
  shield: <><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  sparkle: <><path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7Z" /><path d="M19 3v3M17.5 4.5h3" /></>,
} as const;

export type IconName = keyof typeof P;

export default function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {P[name]}
    </svg>
  );
}

// Which icon each menu page uses.
export const PAGE_ICON: Record<string, IconName> = {
  "/home": "home", "/reports": "chart", "/report": "plus", "/my-reports": "inbox", "/incidents": "alert",
  "/approvals": "stamp", "/inventory": "db", "/tasks": "check", "/register": "book", "/users": "users", "/audit": "list",
  "/notifications": "bell",
};
