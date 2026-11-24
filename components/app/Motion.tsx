"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Where the motion goes (one place, so it stays consistent and easy to tune):
//  - Switching folder tabs on the same page: the content slides in from the
//    side of the tab you clicked, like turning a page in a folder.
//  - Going to another page: the content fades in, calm and quick.
//  - The tab you just opened gives a small bounce.
// Only transform and opacity are animated (cheap for the browser, no lag),
// and nothing moves for people who ask their computer for reduced motion.
const EASE = "cubic-bezier(.2,.8,.2,1)";
const SPRING = "cubic-bezier(.34,1.56,.64,1)";

function tabIndex() {
  const tabs = [...document.querySelectorAll<HTMLElement>(".hub-tabs .hub-tab")];
  return { tabs, i: tabs.findIndex((t) => t.getAttribute("aria-current") === "page") };
}

export default function Motion() {
  const path = usePathname();
  const query = useSearchParams().toString();
  const last = useRef<{ path: string; tab: number } | null>(null);

  // Layout effect: runs after React puts the new page in, but before the
  // browser paints it, so the first frame is already the start of the animation.
  useLayoutEffect(() => {
    const { tabs, i } = tabIndex();
    const prev = last.current;
    last.current = { path, tab: i };
    if (!prev) return; // first load: the cards' own entrance is enough
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const main = document.getElementById("main");
    if (!main) return;

    if (prev.path === path && i !== -1 && prev.tab !== -1 && i !== prev.tab) {
      const from = i > prev.tab ? 36 : -36;
      main.animate(
        [{ opacity: 0, transform: `translateX(${from}px)` }, { opacity: 1, transform: "none" }],
        { duration: 320, easing: EASE },
      );
      tabs[i]?.animate(
        [{ transform: "none" }, { transform: "translateY(-5px)" }, { transform: "none" }],
        { duration: 420, easing: SPRING },
      );
    } else if (prev.path !== path) {
      main.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
    }
  }, [path, query]);

  return null;
}
