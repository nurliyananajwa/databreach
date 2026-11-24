import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { MENU, type Role } from "@/lib/roles";
import Icon, { PAGE_ICON, type IconName } from "@/components/app/hub/icons";
import Pending from "@/components/app/hub/Pending";

// The folder tabs under the header. Home and every inner page use the same
// strip, so moving between pages feels like opening another folder.
export type Tab = { href: string; icon: IconName; title: string; sub: string; current?: boolean; metric?: [string, string] };

export function TabStrip({ tabs }: { tabs: Tab[] }) {
  return (
    <nav className="hub-tabs" aria-label="Quick places">
      {tabs.map((t) => (
        <Link key={t.title + t.href} href={t.href} className="hub-tab" aria-current={t.current ? "page" : undefined}>
          <span className="ic"><Icon name={t.icon} /></span>
          <span style={{ minWidth: 0 }}><b>{t.title}</b><small>{t.sub}</small></span>
          {t.metric && t.metric[1] !== "0" && <span className="metric"><b>{t.metric[1]}</b> {t.metric[0]}</span>}
          <Pending />
        </Link>
      ))}
    </nav>
  );
}

// The places each role uses most. A page that is not in the list (Users,
// Settings...) is added at the end, so the raised tab always says where you are.
const BASE: Record<Role, Omit<Tab, "current">[]> = {
  staff: [
    { href: "/home", icon: "home", title: "Overview", sub: "Today" },
    { href: "/report", icon: "plus", title: "Report", sub: "About 2 minutes" },
    { href: "/my-reports", icon: "inbox", title: "My reports", sub: "What happened next" },
    { href: "/tasks", icon: "check", title: "My tasks", sub: "Given to you" },
  ],
  dp_lead: [
    { href: "/home", icon: "home", title: "Overview", sub: "Today" },
    { href: "/incidents", icon: "alert", title: "Incidents", sub: "Open cases" },
    { href: "/inventory", icon: "db", title: "Inventory", sub: "Where data is kept" },
    { href: "/register", icon: "book", title: "Register", sub: "Kept 2 years" },
  ],
  manager: [
    { href: "/home", icon: "home", title: "Overview", sub: "Today" },
    { href: "/incidents", icon: "alert", title: "Incidents", sub: "Open cases" },
    { href: "/inventory", icon: "db", title: "Inventory", sub: "Where data is kept" },
    { href: "/register", icon: "book", title: "Register", sub: "Kept 2 years" },
  ],
};

const SHORT: Record<string, string> = { "/notifications": "Notifications", "/settings": "Settings", "/reports": "Reports", "/audit": "Audit log", "/users": "Users", "/approvals": "Approvals", "/tasks": "Tasks" };

export default async function PageTabs({ here, sub }: { here: string; sub?: string }) {
  const me = await getCurrentUser();
  const tabs: Tab[] = BASE[me.role].map((t) => ({ ...t, current: t.href === here, sub: t.href === here && sub ? sub : t.sub }));
  if (!tabs.some((t) => t.current)) {
    const m = MENU.find((x) => x.href === here);
    tabs.push({ href: here, icon: PAGE_ICON[here] ?? "home", title: SHORT[here] ?? m?.label ?? "This page", sub: sub ?? "You are here", current: true });
  }
  return <TabStrip tabs={tabs} />;
}
