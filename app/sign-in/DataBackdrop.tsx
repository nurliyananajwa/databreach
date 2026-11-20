"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./data-backdrop.css";

// Decorative field names only. No customer values or records are rendered here.
const FIELDS = [
  ["Email address", 10, 17], ["Customer records", 71, 12],
  ["Full name", 38, 10], ["Phone number", 83, 30],
  ["Identity number", 5, 40], ["Delivery address", 64, 27],
  ["Payment details", 19, 60], ["Personal data", 76, 53],
  ["Health information", 5, 77], ["Access history", 67, 77],
  ["Staff records", 39, 86], ["Date of birth", 84, 87],
  ["Contact details", 21, 31], ["Source linked", 87, 64],
  ["Assessment record", 14, 89], ["Data inventory", 50, 17],
  ["Incident history", 51, 70], ["Account details", 30, 74],
] as const;

export default function DataBackdrop() {
  const layer = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => { setReduced(motion.matches); setTouch(pointer.matches); };
    update();
    motion.addEventListener("change", update);
    pointer.addEventListener("change", update);
    return () => { motion.removeEventListener("change", update); pointer.removeEventListener("change", update); };
  }, []);

  useEffect(() => {
    const element = layer.current;
    if (!element || paused || reduced) return;
    let frame = 0;
    let timer = 0;
    let x = -400;
    let y = -400;
    const hide = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      element.style.setProperty("--reveal", "0");
    };
    const update = (event: PointerEvent) => {
      if (event.pointerType === "touch" && event.type !== "pointerdown") return;
      if (event.target instanceof Element && event.target.closest(".pa-panel, .pa-header, .pa-motion-control")) { hide(); return; }
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = window.requestAnimationFrame(() => {
        element.style.setProperty("--pointer-x", `${x}px`);
        element.style.setProperty("--pointer-y", `${y}px`);
        element.style.setProperty("--reveal", "1");
        frame = 0;
      });
      window.clearTimeout(timer);
      // A tap briefly reveals the same field on coarse-pointer devices.
      if (event.pointerType !== "mouse") timer = window.setTimeout(hide, 1400);
    };
    const leave = (event: PointerEvent) => { if (!event.relatedTarget) hide(); };
    const visibility = () => { hide(); element.dataset.visible = String(!document.hidden); };
    window.addEventListener("pointermove", update, { passive: true });
    window.addEventListener("pointerdown", update, { passive: true });
    window.addEventListener("pointerout", leave, { passive: true });
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      hide();
      window.removeEventListener("pointermove", update);
      window.removeEventListener("pointerdown", update);
      window.removeEventListener("pointerout", leave);
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [paused, reduced]);

  const fields = FIELDS.map(([label, left, top], index) => <span
    className="pa-data-field" key={label}
    style={{ left: `${left}%`, top: `${top}%`, "--drift-duration": `${20 + index % 6 * 3}s`, "--drift-delay": `${-index * 2}s`, "--tilt": `${index % 2 ? 5 : -5}deg` } as CSSProperties}
  ><span className="pa-data-prefix">{index % 3 === 0 ? "record." : "field."}</span>{label}</span>);

  return <>
    <div ref={layer} className="pa-data-backdrop" aria-hidden="true" data-paused={paused || reduced}>
      <div className="pa-data-base">{fields}</div>
      <div className="pa-data-revealed">{fields}</div>
    </div>
    <footer className="pa-motion-control">
      <span>{reduced ? "Reduced motion enabled" : touch ? "Tap the background to reveal the data" : "Move your cursor to reveal the data"}</span>
      {!reduced && <button type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? "Enable background motion" : "Pause background motion"}</button>}
    </footer>
  </>;
}
