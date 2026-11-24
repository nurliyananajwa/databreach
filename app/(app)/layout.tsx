import { BellLink } from "@/components/app/BellLink";
import "@fontsource-variable/manrope/wght.css";
import "@fontsource-variable/fraunces/wght.css"; // titles and big numbers
import "./hub.css";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MENU, menuFor, ROLE_LABEL } from "@/lib/roles";
import { signOut } from "@/app/sign-in/actions";
import HubNav from "@/components/app/HubNav";
import Icon from "@/components/app/hub/icons";
import AccountMenu from "@/components/app/AccountMenu";
import SearchButton, { type Action } from "@/components/app/SearchButton";
import { markAllRead } from "@/app/(app)/notifications/actions";
import LiveUpdates from "@/components/app/LiveUpdates";
import Tour from "@/components/app/Tour";
import { Suspense } from "react";
import Pending from "@/components/app/hub/Pending";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  const items = menuFor(me.role).map(({ href, label }) => ({ href, label }));
  // Search lists every page this role may open, including ones not in the menu.
  const searchable = MENU.filter((m) => m.roles.includes(me.role)).map(({ href, label }) => ({ href, label }));
  const actions: Action[] = [
    ...(me.role === "manager" ? [{ label: "Invite someone", icon: "users", href: "/users#invite-heading" } as Action] : []),
    { label: "Mark all notifications as read", icon: "bell", run: "markRead" },
    { label: "Ask AI (coming soon)", icon: "sparkle", href: "/home?panel=ai" },
    { label: "Show the How it works tour", icon: "log", run: "tour" },
  ];
  // Unread notifications for the bell (RLS: only this person's own alerts).
  const db = await createClient();
  const { count: unread } = await db.from("alerts").select("id", { count: "exact", head: true }).is("read_at", null);

  return (
    <div className="hub">
      <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
      {/* The gradient band starts here; each page's header continues it. */}
      <div className="hub-frame">
      <div className="hub-band hub-band-top">
        <header className="hub-bar">
          <Link href="/home" className="hub-logo">
            <i><Icon name="shield" className="size-5" /></i>PDPA Tracker
          </Link>
          <HubNav items={items} />
          <div className="hub-me">
            <SearchButton items={searchable} actions={actions} markRead={markAllRead} />
            <BellLink unread={unread ?? 0} />
            {/* The AI helper is "Coming soon" until the supervisor approves it. */}
            <Link href="/home?panel=ai" className="hub-ai" data-tour="ai" aria-label="Ask AI, coming soon" title="Ask AI (coming soon)">
              <Icon name="sparkle" className="size-4" /><span className="lbl">Ask AI</span><span className="hub-tag">Soon</span>
              <Pending />
            </Link>
            <AccountMenu name={me.fullName} email={me.email} role={ROLE_LABEL[me.role]} signOut={signOut} />
          </div>
        </header>
      </div>
      {children}
      </div>
      <LiveUpdates userId={me.id} role={me.role} />
      {/* useSearchParams needs a Suspense boundary; the tour renders nothing until started */}
      <Suspense fallback={null}><Tour userId={me.id} role={me.role} /></Suspense>
    </div>
  );
}
