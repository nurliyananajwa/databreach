import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { menuFor, ROLE_LABEL } from "@/lib/roles";
import { signOut } from "@/app/sign-in/actions";
import SideNav from "@/components/app/SideNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  const items = menuFor(me.role).map(({ href, label }) => ({ href, label }));

  return (
    <div className="min-h-screen md:grid md:grid-cols-[15rem_1fr]">
      <aside className="border-b border-rule bg-sheet md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
        <div className="flex h-full flex-col gap-6 p-4">
          <Link href="/home" className="flex items-center gap-2 px-2 pt-1 font-bold leading-tight">
            <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden="true">
              <rect x="3" y="2.5" width="16" height="19" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M7 8h8M7 12h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="17" cy="17" r="5" fill="var(--color-stamp)" />
              <path d="M17 14.6V17l1.6 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            </svg>
            <span>PDPA Breach Response Tracker</span>
          </Link>

          <SideNav items={items} />

          <div className="mt-auto border-t border-rule px-2 pt-4 text-sm">
            <p className="font-bold">{me.fullName}</p>
            <p className="text-muted">{ROLE_LABEL[me.role]}</p>
            <p className="text-muted">{me.orgName}</p>
            <form action={signOut} className="mt-3">
              <button type="submit" className="font-bold underline decoration-rule decoration-2 underline-offset-4 hover:decoration-ink">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main id="main" className="min-w-0 px-5 py-8 sm:px-10">
        {children}
      </main>
    </div>
  );
}
