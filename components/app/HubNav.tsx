"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { PAGE_ICON } from "./hub/icons";
import Pending from "./hub/Pending";

// Pill navigation: icons only, the current page also shows its name;
// the others show theirs on hover or keyboard focus.
export default function HubNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="hub-nav" aria-label="App" data-tour="nav">
      {items.map((it) => {
        const active = pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined} data-tip={it.label}>
            <Icon name={PAGE_ICON[it.href] ?? "home"} />
            <span className={active ? "lbl" : "sr-only"}>{it.label}</span>
            <Pending />
          </Link>
        );
      })}
    </nav>
  );
}
