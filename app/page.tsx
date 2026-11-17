import Link from "next/link";
import Hero from "@/components/landing/Hero";
import Inventory from "@/components/landing/Inventory";
import Journey from "@/components/landing/Journey";

function Mark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      <rect x="3" y="2.5" width="16" height="19" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M7 8h8M7 12h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="17" r="5" fill="var(--color-stamp)" />
      <path d="M17 14.6V17l1.6 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-sheet focus:px-4 focus:py-2">
        Skip to content
      </a>

      <header className="on-dark absolute inset-x-0 top-0 z-40 text-white">
        <nav aria-label="Main" className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-4 sm:gap-8 sm:px-8">
          <Link href="/" className="mr-auto flex items-center gap-2.5 font-bold leading-tight">
            <Mark />
            <span>PDPA Breach Response Tracker</span>
          </Link>
          <ul className="hidden items-center gap-7 text-[0.95rem] md:flex">
            {[
              ["#try", "Try it"],
              ["#data", "Your data"],
              ["#how", "How it works"],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="text-white/80 underline-offset-4 hover:text-white hover:underline">{label}</a>
              </li>
            ))}
          </ul>
          <Link href="/sign-in" className="shrink-0 whitespace-nowrap rounded-md bg-white px-5 py-2 text-[0.95rem] font-bold text-ink hover:bg-paper">
            Sign in
          </Link>
        </nav>
      </header>

      <main id="main">
        <Hero />

        {/* Data inventory preview */}
        <section id="data" className="scroll-mt-20 bg-sheet">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-14">
            <div className="lg:sticky lg:top-12 lg:self-start">
              <h2 className="font-bold leading-[1.02] tracking-[-0.02em]" style={{ fontSize: "clamp(2.2rem, 3.6vw, 3.1rem)" }}>
                You hold more personal data than you think.
              </h2>
              <p className="mt-5 text-lg text-muted">
                Start by listing where it lives. When a breach happens, the inventory suggests the
                data involved. Your Compliance Officer confirms what was exposed.
              </p>
              <p className="mt-4 text-muted">
                The inventory stores field names only, never the customer values.
              </p>
            </div>
            <Inventory />
          </div>
        </section>

        {/* Who does what, and when */}
        <section id="how" className="scroll-mt-20 border-t border-rule bg-paper">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
            <h2 className="max-w-3xl font-bold leading-[1.02] tracking-[-0.02em]" style={{ fontSize: "clamp(2.2rem, 4.2vw, 3.6rem)" }}>
              Who does what, and by when.
            </h2>
            <p className="mt-5 max-w-2xl text-lg text-muted">
              Three roles share one record. Each person sees only what their job needs, and the
              tracker helps the team track its next steps.
            </p>
            <div className="mt-10">
              <Journey />
            </div>
          </div>
        </section>

        {/* Closing */}
        <section className="on-dark bg-ink text-white">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
            <h2 className="max-w-3xl font-bold leading-[1.0] tracking-[-0.03em]" style={{ fontSize: "clamp(2.4rem, 5.4vw, 4.8rem)" }}>
              Be ready before the next breach.
            </h2>
            <p className="mt-5 max-w-lg text-lg text-white/75">
              Your manager invites you. Sign in with the account they added.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/sign-in" className="rounded-md bg-white px-6 py-3 font-bold text-ink hover:bg-paper">
                Sign in
              </Link>
              <a href="#try" className="font-bold text-white/85 underline decoration-white/30 decoration-2 underline-offset-4 hover:text-white hover:decoration-white">
                Try the breach demo again
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-white/60">
        <div className="mx-auto max-w-7xl border-t border-white/15 px-5 py-8 text-sm sm:px-8">
          <p className="max-w-3xl">
            Academic prototype for IMS568, Faculty of Information Science, UiTM Puncak Perdana. All
            businesses, people and data shown are fictional. It does not give legal advice and never
            sends notifications: your business decides and sends them.
          </p>
        </div>
      </footer>
    </>
  );
}
