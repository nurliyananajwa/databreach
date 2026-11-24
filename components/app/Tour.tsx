"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Role } from "@/lib/roles";

type Step = { target: string; title: string; body: string; roles?: Role[] };

// The "How it works" tour. Each step highlights one part of Home (marked
// with data-tour="...") and explains it in a sentence or two. Steps whose
// part is not on screen for this role are skipped.
const STEPS: Step[] = [
  { target: "nav", title: "The menu", body: "Every page you can use. Hover an icon to see its name. You only see the pages your role is allowed to open." },
  { target: "search", title: "Search", body: "Press Ctrl + K anywhere to jump to a page or do something, like reporting a breach." },
  { target: "bell", title: "Notifications", body: "Reminders 24 hours and 6 hours before a deadline, and anything that needs you." },
  { target: "report", title: "Report a breach", body: "If something goes wrong with personal data, report it here straight away, even if you are not sure. The Compliance Officer takes it from there.", roles: ["staff"] },
  { target: "clock", title: "The 72-hour clock", body: "The law gives 72 hours to notify the Commissioner, counted from when the business became aware. Hover the bar to see the times; click it to see every deadline.", roles: ["dp_lead", "manager"] },
  { target: "approve", title: "Waiting for you", body: "Notice drafts wait here for your approval. The clock keeps running while they wait.", roles: ["manager"] },
  { target: "inventory", title: "Your data inventory", body: "Where personal data is kept. Every incident starts from this list, so keep it up to date.", roles: ["dp_lead"] },
  { target: "side", title: "Activity log", body: "Every change by anyone, saved and locked so it can never be edited. New entries appear live, no refresh needed.", roles: ["manager"] },
  { target: "side", title: "Alerts", body: "Reminders meant for you. New ones appear live, no refresh needed.", roles: ["staff", "dp_lead"] },
  { target: "progress", title: "The four steps", body: "Every breach goes Locate, Assess, Notify, Record. Click a step to see what happens and who does it.", roles: ["dp_lead", "manager"] },
  { target: "ai", title: "Ask AI (coming soon)", body: "An AI helper is on its way. It will suggest; a person always decides." },
];

const PAD = 8;

export default function Tour({ userId, role, home = "/home" }: { userId: string; role: Role; home?: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>([]);
  const [i, setI] = useState(-1); // -1 = closed
  const [box, setBox] = useState<DOMRect | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const seenKey = `hub-tour-seen-${userId}`;

  const start = useCallback(() => {
    const visible = STEPS.filter((s) => (!s.roles || s.roles.includes(role)) && document.querySelector(`[data-tour="${s.target}"]`));
    if (!visible.length) return;
    setSteps(visible);
    setI(0);
  }, [role]);

  const close = useCallback(() => {
    setI(-1);
    try { localStorage.setItem(seenKey, "1"); } catch {}
  }, [seenKey]);

  // First visit to Home: start once. "?tour=1" or the search action replays it.
  useEffect(() => {
    if (pathname !== home) return;
    let seen = true;
    try { seen = localStorage.getItem(seenKey) === "1"; } catch {}
    if (params.get("tour") === "1" || !seen) {
      const t = setTimeout(start, 700); // let the cards finish arriving
      return () => clearTimeout(t);
    }
  }, [pathname, params, seenKey, start, home]);

  useEffect(() => {
    const replay = () => (pathname === home ? start() : router.push(`${home}?tour=1`));
    window.addEventListener("hub:tour", replay);
    return () => window.removeEventListener("hub:tour", replay);
  }, [pathname, router, start, home]);

  // Follow the highlighted part as the page scrolls or resizes.
  useLayoutEffect(() => {
    if (i < 0 || !steps[i]) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${steps[i].target}"]`);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    const measure = () => setBox(el.getBoundingClientRect());
    measure();
    const t = setTimeout(measure, 450);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    card.current?.focus();
    return () => { clearTimeout(t); window.removeEventListener("scroll", measure, true); window.removeEventListener("resize", measure); };
  }, [i, steps]);

  if (i < 0 || !steps[i] || !box) return null;
  const step = steps[i];
  const last = i === steps.length - 1;

  // Card below the part if there is room, otherwise above; kept on screen.
  const W = Math.min(340, window.innerWidth - 24);
  const CARD_H = 240; // tallest card, so it never runs off screen
  const below = box.bottom + PAD + 12 + CARD_H < window.innerHeight;
  const left = Math.max(12, Math.min(box.left + box.width / 2 - W / 2, window.innerWidth - W - 12));
  const top = below
    ? box.bottom + PAD + 12
    : Math.max(12, Math.min(box.top - PAD - 12 - CARD_H, window.innerHeight - CARD_H - 12));

  return (
    <div className="hub-tour" onKeyDown={(e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" && !last) setI(i + 1);
      if (e.key === "ArrowLeft" && i > 0) setI(i - 1);
    }}>
      <div className="hub-tour-spot" style={{ left: box.left - PAD, top: box.top - PAD, width: box.width + PAD * 2, height: box.height + PAD * 2 }} aria-hidden="true" />
      <div ref={card} className="hub-tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body" tabIndex={-1} style={{ left, top, width: W }}>
        <small>How it works · {i + 1} of {steps.length}</small>
        <h2 id="tour-title">{step.title}</h2>
        <p id="tour-body">{step.body}</p>
        <div className="hub-tour-actions">
          <button type="button" className="skip" onClick={close}>Skip tour</button>
          {i > 0 && <button type="button" onClick={() => setI(i - 1)}>Back</button>}
          <button type="button" className="next" onClick={() => (last ? close() : setI(i + 1))}>{last ? "Done" : "Next"}</button>
        </div>
        {last && <p className="hub-tour-foot">Replay it any time: Ctrl + K, then “tour”.</p>}
      </div>
    </div>
  );
}
