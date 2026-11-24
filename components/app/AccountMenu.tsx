"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import Icon from "@/components/app/hub/icons";
import SignOutButton from "@/components/app/SignOutButton";

// The avatar opens a small panel: who you are, then Settings and Sign out.
// A disclosure (button + panel), not an ARIA "menu": it holds a link and a
// form, so plain Tab order is the right keyboard model.
export default function AccountMenu({ name, email, role, signOut }: {
  name: string; email: string; role: string; signOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    box.current?.querySelector<HTMLElement>(".hub-acct-panel a")?.focus();
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="hub-acct" ref={box}>
      <button ref={btn} type="button" className="hub-chip" aria-expanded={open} aria-controls={id} aria-label={`Account: ${name}`} onClick={() => setOpen((o) => !o)}>
        <span className="hub-av" aria-hidden="true">{name.charAt(0)}</span>
        <Icon name="chev" className="hub-acct-chev" />
      </button>
      <div id={id} className="hub-acct-panel" hidden={!open}>
        <div className="who">
          <span className="hub-av big" aria-hidden="true">{name.charAt(0)}</span>
          <span><b>{name}</b><small>{email}</small><em>{role}</em></span>
        </div>
        <Link href="/settings" onClick={() => setOpen(false)}><Icon name="gear" className="size-4" />Settings</Link>
        <form action={signOut}><SignOutButton /></form>
      </div>
    </div>
  );
}
