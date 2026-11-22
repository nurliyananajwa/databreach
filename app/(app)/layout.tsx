import "@fontsource-variable/manrope/wght.css";
import "./hub.css";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { menuFor, ROLE_LABEL } from "@/lib/roles";
import { signOut } from "@/app/sign-in/actions";
import HubNav from "@/components/app/HubNav";
import Icon from "@/components/app/hub/icons";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  const items = menuFor(me.role).map(({ href, label }) => ({ href, label }));

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
            <span className="hub-chip">
              <span className="role">{ROLE_LABEL[me.role]}</span>
              <span className="hub-av" title={me.fullName}>{me.fullName.charAt(0)}</span>
            </span>
            <form action={signOut}>
              <button type="submit" className="hub-out">Sign out</button>
            </form>
          </div>
        </header>
      </div>
      {children}
    </div>
  );
}
