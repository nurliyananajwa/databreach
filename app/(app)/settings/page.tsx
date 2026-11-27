import { requirePage } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";
import PageHeader from "@/components/app/PageHeader";
import type { Tab } from "@/components/app/PageTabs";
import Icon from "@/components/app/hub/icons";
import SettingsView from "./SettingsView";

export const metadata = { title: "Settings | Breachfolio" };

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [me, sp] = await Promise.all([requirePage("/settings"), searchParams]);
  const look = sp.tab === "appearance";
  const tabs: Tab[] = [
    { href: "/settings", icon: "person", title: "Profile", sub: "Your name and role", current: !look },
    { href: "/settings?tab=appearance", icon: "gear", title: "Appearance", sub: "Coming soon", current: look },
  ];
  return (
    <>
      <PageHeader tabs={tabs} title="Settings" intro="Your own details. Every change is written to the activity log." />
      {look ? (
        <main id="main" className="hub-main">
          <section className="hub-card hub-view" aria-labelledby="look-h">
            <div className="hub-ch"><div>
              <h2 id="look-h"><Icon name="gear" />Appearance</h2>
              <p className="sub">How the app looks for you</p>
            </div></div>
            <div className="hub-soon">
              <span className="ic"><Icon name="gear" /></span>
              <strong>Coming soon</strong>
              <p>Light and dark mode. Your choice will be kept for your account only.</p>
            </div>
          </section>
        </main>
      ) : (
        <SettingsView name={me.fullName} email={me.email} role={ROLE_LABEL[me.role]} org={me.orgName} />
      )}
    </>
  );
}
