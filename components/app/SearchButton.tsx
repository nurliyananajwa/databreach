"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon, { PAGE_ICON, type IconName } from "./hub/icons";

type Item = { href: string; label: string };
// An action is a link, the "mark all read" server action, or the tour.
export type Action = { label: string; icon: IconName; href?: string; run?: "markRead" | "tour" };
type Entry = { key: string; label: string; icon: IconName; group: "Actions" | "Pages"; href?: string; run?: Action["run"] };

// Search: the magnifying glass or Ctrl/Cmd + K opens it. Type a few letters,
// arrows to choose, Enter to go or do. It lists actions and the pages this
// role may open (the server decides both lists). Data places and incidents
// join from Sprint 2.
export default function SearchButton({ items, actions = [], markRead }: { items: Item[]; actions?: Action[]; markRead?: () => Promise<void> }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);

  const results = useMemo<Entry[]>(() => {
    const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const all: Entry[] = [
      ...actions.map((a) => ({ key: "a:" + a.label, label: a.label, icon: a.icon, group: "Actions" as const, href: a.href, run: a.run })),
      ...items.map((it) => ({ key: "p:" + it.href, label: it.label, icon: PAGE_ICON[it.href] ?? ("home" as IconName), group: "Pages" as const, href: it.href })),
    ];
    return all.filter((e) => words.every((w) => e.label.toLowerCase().includes(w)));
  }, [q, items, actions]);

  function open() {
    setQ("");
    setAt(0);
    dialog.current?.showModal();
    requestAnimationFrame(() => input.current?.focus());
  }
  async function go(e: Entry) {
    dialog.current?.close();
    if (e.run === "tour") window.dispatchEvent(new Event("hub:tour"));
    else if (e.run === "markRead" && markRead) { await markRead(); router.refresh(); }
    else if (e.href) router.push(e.href);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // open() only uses refs and setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <button type="button" className="hub-bell" onClick={open} aria-label="Search (Ctrl + K)" aria-haspopup="dialog" data-tour="search">
        <Icon name="search" className="size-5" />
      </button>
      <dialog
        ref={dialog}
        className="hub-search"
        aria-label="Search"
        onClick={(e) => { if (e.target === dialog.current) dialog.current.close(); }}
      >
        <div className="hub-search-box">
          <label className="hub-search-field">
            <Icon name="search" className="size-5" />
            <span className="sr-only">Go to page</span>
            <input
              ref={input}
              value={q}
              placeholder="Search pages and actions…"
              role="combobox"
              aria-expanded="true"
              aria-controls="hub-search-list"
              aria-activedescendant={results[at] ? `hub-search-${at}` : undefined}
              onChange={(e) => { setQ(e.target.value); setAt(0); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setAt((i) => Math.min(i + 1, results.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setAt((i) => Math.max(i - 1, 0)); }
                if (e.key === "Enter" && results[at]) { e.preventDefault(); go(results[at]); }
              }}
            />
            <kbd>Esc</kbd>
          </label>
          <ul id="hub-search-list" role="listbox" aria-label="Actions and pages">
            {results.map((it, i) => (
              <li key={it.key} id={`hub-search-${i}`} role="option" aria-selected={i === at} data-group={i === 0 || results[i - 1].group !== it.group ? it.group : undefined}>
                <button type="button" tabIndex={-1} onMouseEnter={() => setAt(i)} onClick={() => go(it)}>
                  <span className="ic"><Icon name={it.icon} /></span>
                  {it.label}
                  {it.group === "Actions" && <span className="kind">Action</span>}
                </button>
              </li>
            ))}
            {!results.length && <li className="none">Nothing matches “{q}”.</li>}
          </ul>
          <p className="hub-search-foot">Searching data sets and incidents comes with Sprint 3.</p>
        </div>
      </dialog>
    </>
  );
}
