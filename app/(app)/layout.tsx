import { BellLink } from "@/components/app/BellLink";
import "@fontsource-variable/manrope/wght.css";
import "./hub.css";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { menuFor, ROLE_LABEL } from "@/lib/roles";
import { signOut } from "@/app/sign-in/actions";
import HubNav from "@/components/app/HubNav";
import Icon from "@/components/app/hub/icons";
import SignOutButton from "@/components/app/SignOutButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  const items = menuFor(me.role).map(({ href, label }) => ({ href, label }));
  // Unread notifications for the bell (RLS: only this person's own alerts).
  const db = await createClient();
  const { count: unread } = await db.from("alerts").select("id", { count: "exact", head: true }).is("read_at", null);

  return (
    <div className="hub">
      <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
      {/* The teal band starts here; each page's header continues it. */}
      <div className="hub-band on-dark">
        <header className="hub-bar">
          <Link href="/home" className="hub-logo">
            <i><Icon name="shield" className="size-5" /></i>PDPA Tracker
          </Link>
          <HubNav items={items} />
          <div className="hub-me">
            <BellLink unread={unread ?? 0} />
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
  );
}
