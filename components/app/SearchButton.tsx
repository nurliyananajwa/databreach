"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon, { PAGE_ICON } from "./hub/icons";

type Item = { href: string; label: string };

// "Jump to" search: the magnifying glass or Ctrl/Cmd + K opens it, type a few
// letters, Enter goes there. It lists only the pages this role may open
// (the server decides that list). Data places and incidents join from Sprint 2.
export default function SearchButton({ items }: { items: Item[] }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);

  const results = useMemo(() => {
    const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return items.filter((it) => words.every((w) => it.label.toLowerCase().includes(w)));
  }, [q, items]);

  function open() {
    setQ("");
    setAt(0);
    dialog.current?.showModal();
    requestAnimationFrame(() => input.current?.focus());
  }
  function go(href: string) {
    dialog.current?.close();
    router.push(href);
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
      <button type="button" className="hub-bell" onClick={open} aria-label="Search (Ctrl + K)" aria-haspopup="dialog">
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
              placeholder="Go to… (for example: users, audit, report)"
              role="combobox"
              aria-expanded="true"
              aria-controls="hub-search-list"
              aria-activedescendant={results[at] ? `hub-search-${at}` : undefined}
              onChange={(e) => { setQ(e.target.value); setAt(0); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setAt((i) => Math.min(i + 1, results.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setAt((i) => Math.max(i - 1, 0)); }
                if (e.key === "Enter" && results[at]) { e.preventDefault(); go(results[at].href); }
              }}
            />
            <kbd>Esc</kbd>
          </label>
          <ul id="hub-search-list" role="listbox" aria-label="Pages">
            {results.map((it, i) => (
              <li key={it.href} id={`hub-search-${i}`} role="option" aria-selected={i === at}>
                <button type="button" tabIndex={-1} onMouseEnter={() => setAt(i)} onClick={() => go(it.href)}>
                  <span className="ic"><Icon name={PAGE_ICON[it.href] ?? "home"} /></span>
                  {it.label}
                </button>
              </li>
            ))}
            {!results.length && <li className="none">No page called “{q}”.</li>}
          </ul>
          <p className="hub-search-foot">Searching data places and incidents comes with Sprints 2 and 3.</p>
        </div>
      </dialog>
    </>
  );
}
