import { BellLink } from "@/components/app/BellLink";
import "@fontsource-variable/manrope/wght.css";
import "./hub.css";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MENU, menuFor, ROLE_LABEL } from "@/lib/roles";
import { signOut } from "@/app/sign-in/actions";
import HubNav from "@/components/app/HubNav";
import Icon from "@/components/app/hub/icons";
import SignOutButton from "@/components/app/SignOutButton";
import SearchButton from "@/components/app/SearchButton";
import Pending from "@/components/app/hub/Pending";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  const items = menuFor(me.role).map(({ href, label }) => ({ href, label }));
  // Search lists every page this role may open, including ones not in the menu.
  const searchable = MENU.filter((m) => m.roles.includes(me.role)).map(({ href, label }) => ({ href, label }));
  // Unread notifications for the bell (RLS: only this person's own alerts).
  const db = await createClient();
  const { count: unread } = await db.from("alerts").select("id", { count: "exact", head: true }).is("read_at", null);

  return (
    <div className="hub">
      <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
      {/* The pale band starts here; each page's header continues it. */}
      <div className="hub-frame">
      <div className="hub-band hub-band-top">
        <header className="hub-bar">
          <Link href="/home" className="hub-logo">
            <i><Icon name="shield" className="size-5" /></i>PDPA Tracker
          </Link>
          <HubNav items={items} />
          <div className="hub-me">
            <SearchButton items={searchable} />
            <BellLink unread={unread ?? 0} />
            {/* The AI helper is "Coming soon" until the supervisor approves it. */}
            <Link href="/home?panel=ai" className="hub-ai" aria-label="Ask AI, coming soon" title="Ask AI (coming soon)">
              <Icon name="sparkle" className="size-4" /><span className="lbl">Ask AI</span><span className="hub-tag">Soon</span>
              <Pending />
            </Link>
            <span className="hub-chip">
              <span className="role">{ROLE_LABEL[me.role]}</span>
              <span className="hub-av" title={me.fullName}>{me.fullName.charAt(0)}</span>
            </span>
            <form action={signOut}>
              <SignOutButton />
            </form>
          </div>
        </header>
      </div>
      {children}
      </div>
    </div>
  );
}
