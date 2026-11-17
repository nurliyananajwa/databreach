"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// A 3D cloud of fictional personal-data fragments drawn on a 2D canvas with a
// tiny perspective projection (no WebGL library). Three colours: white on navy,
// red for exposed data. Pauses when off-screen or the tab is hidden.

export type Kind = "name" | "phone" | "email" | "address" | "ic" | "bank" | "salary" | "card" | "health" | "dob" | "photo";

export type CloudHandle = { expose: (kinds: Kind[], spill: number) => void };

// --- fictional sample text, generated (never real people) -------------------
const FIRST = ["Aina", "Farid", "Siti", "Daniel", "Mei Ling", "Arjun", "Nurul", "Hafiz", "Priya", "Wei Jie", "Aisyah", "Kumar", "Liyana", "Ethan", "Zara", "Amir"];
const LAST = ["Rahman", "Tan", "Abdullah", "Lim", "Subramaniam", "Ismail", "Wong", "Hassan", "Lee", "Yusof", "Raj", "Ong"];
const STREET = ["Jalan Ampang", "Jalan Tun Razak", "Persiaran Gurney", "Jalan Kuching", "Jalan Ipoh", "Lorong Maarof", "Jalan SS2/24"];
const HEALTH = ["Asthma", "Diabetes", "Blood test", "Allergy: penicillin", "X-ray", "MC: 2 days"];

const r = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(a: readonly T[]) => a[r(a.length)];
const digits = (n: number) => Array.from({ length: n }, () => r(10)).join("");

function sample(kind: Kind): string {
  switch (kind) {
    case "name": return `${pick(FIRST)} ${pick(LAST)}`;
    case "phone": return `01${r(10)}-${digits(3)} ${digits(4)}`;
    case "email": return `${pick(FIRST).toLowerCase().replace(" ", "")}${r(90) + 10}@mail.com`;
    case "address": return `${r(120) + 1}, ${pick(STREET)}`;
    case "ic": return `${String(r(30) + 70).padStart(2, "0")}${String(r(12) + 1).padStart(2, "0")}${String(r(28) + 1).padStart(2, "0")}-${digits(2)}-${digits(4)}`;
    case "bank": return `Acct ${digits(4)} ${digits(4)} ${digits(4)}`;
    case "salary": return `RM ${(r(80) + 20) * 100}`;
    case "card": return `•••• ${digits(4)}`;
    case "health": return pick(HEALTH);
    case "dob": return `${r(28) + 1}/${r(12) + 1}/${r(40) + 1960}`;
    case "photo": return "IMG_" + digits(4) + ".jpg";
  }
}

const KINDS: Kind[] = ["name", "name", "name", "phone", "phone", "email", "address", "ic", "bank", "salary", "card", "health", "dob", "photo"];

// Each text is drawn once into a small canvas and reused as an image every frame.
type Sprite = { white: HTMLCanvasElement; red: HTMLCanvasElement; w: number; h: number };
const SPRITE_PX = 13;
function makeSprite(text: string, dpr: number): Sprite {
  const mk = (color: string, weight: number) => {
    const c = document.createElement("canvas");
    const g = c.getContext("2d")!;
    const font = `${weight} ${SPRITE_PX * dpr}px "Atkinson Hyperlegible", system-ui, sans-serif`;
    g.font = font;
    c.width = Math.ceil(g.measureText(text).width) + 4;
    c.height = Math.ceil(SPRITE_PX * dpr * 1.4);
    g.font = font;
    g.fillStyle = color;
    g.textBaseline = "middle";
    g.fillText(text, 2, c.height / 2);
    return c;
  };
  const white = mk("#ffffff", 400);
  const red = mk("#e0453a", 700);
  return { white, red, w: white.width / dpr, h: white.height / dpr };
}

type P = {
  x: number; y: number; z: number; // home position in the cloud
  kind: Kind | null; // null = plain dot
  text: string;
  sprite: Sprite | null;
  ox: number; oy: number; // pointer push offset (screen px)
  red: number; // 0..1 red mix
  spill: null | { x: number; y: number; vx: number; vy: number; t: number };
  fade: number; // 0..1 visibility (re-entry after spilling)
};

const DataCloud = forwardRef<CloudHandle, { className?: string }>(function DataCloud({ className }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const parts = useRef<P[]>([]);
  const exposed = useRef<Set<Kind>>(new Set());
  const kick = useRef<() => void>(() => {});

  useImperativeHandle(ref, () => ({
    expose(kinds, spill) {
      exposed.current = new Set(kinds);
      const matches = parts.current.filter((p) => p.kind && exposed.current.has(p.kind) && !p.spill);
      // spill a share of the matching pieces out of the cloud
      for (const p of matches.sort(() => Math.random() - 0.5).slice(0, spill)) {
        p.spill = { x: NaN, y: NaN, vx: (Math.random() - 0.5) * 260, vy: -80 - Math.random() * 160, t: 0 };
      }
      kick.current();
    },
  }));

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 768;
    const nText = small ? 60 : 130;
    const nDots = small ? 500 : 1300;

    // points inside a flattened sphere
    const make = (kind: Kind | null): P => {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, rad = Math.cbrt(Math.random());
      const s = Math.sqrt(1 - u * u) * rad;
      return {
        x: Math.cos(th) * s * 1.55, y: u * rad * 0.8, z: Math.sin(th) * s * 1.1,
        kind, text: kind ? sample(kind) : "", sprite: null, ox: 0, oy: 0, red: 0, spill: null, fade: 1,
      };
    };
    parts.current = [
      ...Array.from({ length: nDots }, () => make(null)),
      ...Array.from({ length: nText }, () => make(pick(KINDS))),
    ];

    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const p of parts.current) p.sprite = null;
    };
    resize();

    let mx = -9999, my = -9999, tiltX = 0, tiltY = 0, angle = 0.6;
    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect();
      mx = e.clientX - b.left; my = e.clientY - b.top;
      tiltY = (mx / w - 0.5) * 0.5; tiltX = (my / h - 0.5) * 0.3;
    };
    const onLeave = () => { mx = my = -9999; };

    let visible = true, raf = 0, last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduce) angle += dt * 0.06;
      ctx.clearRect(0, 0, w, h);

      // desktop: the cloud fills the open right side, above the answer card
      const cx = w * (small ? 0.5 : 0.72), cy = h * (small ? 0.3 : 0.38);
      const R = Math.min(w * (small ? 0.55 : 0.25), h * (small ? 0.45 : 0.36));
      const cosA = Math.cos(angle + tiltY), sinA = Math.sin(angle + tiltY);
      const cosB = Math.cos(tiltX), sinB = Math.sin(tiltX);
      const F = 2.4;

      const drawn: { p: P; sx: number; sy: number; s: number; d: number }[] = [];
      for (const p of parts.current) {
        // rotate around Y then X
        const x1 = p.x * cosA - p.z * sinA;
        const z1 = p.x * sinA + p.z * cosA;
        const y1 = p.y * cosB - z1 * sinB;
        const z2 = p.y * sinB + z1 * cosB;
        const s = F / (F + z2);
        let sx = cx + x1 * R * s, sy = cy + y1 * R * s;

        // push away from the pointer, spring back
        const dx = sx + p.ox - mx, dy = sy + p.oy - my, dist = Math.hypot(dx, dy);
        if (dist < 140 && !reduce) {
          const f = (1 - dist / 140) * 26;
          p.ox += (dx / (dist || 1)) * f * dt * 10;
          p.oy += (dy / (dist || 1)) * f * dt * 10;
        }
        p.ox *= 0.92; p.oy *= 0.92;
        sx += p.ox; sy += p.oy;

        const target = p.kind && exposed.current.has(p.kind) ? 0.55 : 0;
        p.red += (target - p.red) * Math.min(1, dt * 4);

        if (p.spill) {
          const sp = p.spill;
          if (Number.isNaN(sp.x)) { sp.x = sx; sp.y = sy; }
          sp.t += dt;
          sp.vy += 260 * dt; // gravity
          sp.x += sp.vx * dt; sp.y += sp.vy * dt;
          sx = sp.x; sy = sp.y;
          if (sp.t > 3.2) { p.spill = null; p.fade = 0; p.text = p.kind ? sample(p.kind) : ""; p.sprite = null; }
        } else if (p.fade < 1) {
          p.fade = Math.min(1, p.fade + dt * 0.6);
        }
        drawn.push({ p, sx, sy, s, d: z2 });
      }

      drawn.sort((a, b) => b.d - a.d);
      ctx.fillStyle = "#ffffff";
      for (const { p, sx, sy, s, d } of drawn) {
        const depth = Math.max(0, Math.min(1, (1.6 - d) / 3));
        let alpha = (0.06 + depth * 0.5) * p.fade;
        if (p.spill) alpha = Math.max(0, 1 - p.spill.t / 3.2);
        if (!p.kind) {
          ctx.globalAlpha = alpha * 0.9;
          ctx.fillRect(sx, sy, 1.3 * s, 1.3 * s);
          continue;
        }
        if (!p.sprite) p.sprite = makeSprite(p.text, dpr);
        const sc = (p.spill ? 1.05 : 0.62 + s * 0.22);
        const dw = p.sprite.w * sc, dh = p.sprite.h * sc;
        const red = p.spill ? 1 : p.red;
        if (red < 1) {
          ctx.globalAlpha = alpha * (1 - red);
          ctx.drawImage(p.sprite.white, sx, sy - dh / 2, dw, dh);
        }
        if (red > 0) {
          ctx.globalAlpha = Math.min(1, alpha * red + (p.spill ? 0.25 : 0));
          ctx.drawImage(p.sprite.red, sx, sy - dh / 2, dw, dh);
        }
      }
      ctx.globalAlpha = 1;

      if (visible && !reduce) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); }
    };
    kick.current = () => { if (reduce) frame(performance.now()); else start(); };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !document.hidden;
      if (visible) start(); else { cancelAnimationFrame(raf); raf = 0; }
    });
    io.observe(cv);
    const onVis = () => {
      visible = !document.hidden;
      if (visible) start(); else { cancelAnimationFrame(raf); raf = 0; }
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);
    // fonts load late; draw once they are ready
    document.fonts?.ready.then(() => {
      for (const p of parts.current) p.sprite = null; // redraw with the real font
      if (reduce) frame(performance.now());
    });
    if (reduce) frame(performance.now()); else start();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={canvas} className={className} aria-hidden="true" />;
});

export default DataCloud;
