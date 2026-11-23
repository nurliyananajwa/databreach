"use client";

import { useEffect, useState } from "react";

// Counts a number up from 0 when the card appears. Screen readers get the
// final value straight away, and people who turn motion off see it at once.
export default function CountUp({ value, ms = 900 }: { value: number; ms?: number }) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (value === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      setShown(Math.round(value * (1 - Math.pow(1 - k, 3)))); // ease-out
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    setShown(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, ms]);

  return (
    <>
      <span aria-hidden="true">{shown.toLocaleString("en-MY")}</span>
      <span className="sr-only">{value.toLocaleString("en-MY")}</span>
    </>
  );
}
