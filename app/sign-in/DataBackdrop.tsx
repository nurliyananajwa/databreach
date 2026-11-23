"use client";

import { useEffect, useRef, useState } from "react";
import "./data-backdrop.css";

// Deterministic, fictional values only; this never reads organisational records.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// 40 rows (1520px) so the grid still fills tall screens after drifting up 76px.
const CELLS = Array.from({ length: 24 * 40 }, (_, index) => {
  const seed = ((index + 17) * 7919 + index * index * 31) % 104729;
  const kind = index % 7;
  const value = kind === 4 ? `${seed % 28 + 1} ${MONTHS[seed % 12]}`
    : kind === 1 || kind === 2 || kind === 5 ? `${seed % 96 + 4}%`
    : String(seed % (kind === 0 ? 300 : 90) + 1);
  return { value, tone: seed % 17 === 0 ? "coral" : seed % 7 === 0 ? "blue" : "neutral" };
});

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
      // A tap briefly reveals nearby values on coarse-pointer devices.
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

  const cells = CELLS.map(({ value, tone }, index) => (
    <span className="pa-data-cell" data-tone={tone} key={index}>{value}</span>
  ));

  return <>
    <div ref={layer} className="pa-data-backdrop" aria-hidden="true" data-paused={paused || reduced}>
      <div className="pa-data-base"><div className="pa-data-grid">{cells}</div></div>
      <div className="pa-data-revealed"><div className="pa-data-grid">{cells}</div></div>
      <div className="pa-data-vignette" />
    </div>
    <footer className="pa-motion-control">
      <span>{reduced ? "Reduced motion enabled" : touch ? "Tap the background to reveal data" : "Move your cursor to reveal the data"}</span>
      {!reduced && <button type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? "Enable background motion" : "Pause background motion"}</button>}
    </footer>
  </>;
}
