import Link from "next/link";
import Icon, { type IconName } from "@/components/app/hub/icons";
import Pending from "@/components/app/hub/Pending";

// The folder tabs under the header. The top menu says WHERE you are going;
// these tabs show what is INSIDE the page you are on (Inventory: All,
// Sensitive, No owner, Archived). A page with nothing to split shows no tabs.
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
