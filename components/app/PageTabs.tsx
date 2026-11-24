import Link from "next/link";
import { MENU } from "@/lib/roles";
import Icon, { PAGE_ICON, type IconName } from "@/components/app/hub/icons";
import Pending from "@/components/app/hub/Pending";

// The folder tabs under the header. The top menu says WHERE you are going;
// these tabs show what is INSIDE the page you are on (Inventory: All,
// Sensitive, No owner, Archived). A page with nothing to split shows one
// raised tab with its own name, so every page has the same shape.
export type Tab = { href: string; icon: IconName; title: string; sub: string; current?: boolean; metric?: [string, string]; warn?: boolean };

export function TabStrip({ tabs, label = "Views of this page" }: { tabs: Tab[]; label?: string }) {
  return (
    <nav className="hub-tabs" aria-label={label}>
      {tabs.map((t) => (
        <Link key={t.title + t.href} href={t.href} scroll={false} className={`hub-tab${t.warn ? " warn" : ""}`} aria-current={t.current ? "page" : undefined}>
          <span className="ic"><Icon name={t.icon} /></span>
          <span style={{ minWidth: 0 }}><b>{t.title}</b><small>{t.sub}</small></span>
          {t.metric && t.metric[1] !== "0" && <span className="metric"><b>{t.metric[1]}</b> {t.metric[0]}</span>}
          <Pending />
        </Link>
      ))}
    </nav>
  );
}

const SHORT: Record<string, string> = { "/notifications": "Notifications", "/settings": "Settings", "/inventory": "Data inventory", "/register": "Breach register", "/audit": "Audit log" };

// One raised tab with the page's own name.
export default function PageTabs({ here, sub }: { here: string; sub?: string }) {
  const m = MENU.find((x) => x.href === here);
  return <TabStrip tabs={[{ href: here, icon: PAGE_ICON[here] ?? "home", title: SHORT[here] ?? m?.label ?? "This page", sub: sub ?? "You are here", current: true }]} />;
}
