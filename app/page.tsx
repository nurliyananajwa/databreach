import Link from "next/link";
import Hero from "@/components/landing/Hero";
import DataBoard from "@/components/landing/DataBoard";
import Reveal from "@/components/landing/Reveal";

const steps = [
  { title: "Record your data", body: "List the personal data you hold, where it is kept and who can open it. Field names only, never the data itself." },
  { title: "Report a breach", body: "Any staff member reports what happened in two minutes. The 72-hour clock starts from when you found out." },
  { title: "Assess it", body: "Confirm what was exposed. Each legal criterion shows met or not met, with the reason, so the decision is easy to explain." },
  { title: "Notify and keep proof", body: "Your manager approves the notice, you send it, and every step is kept in the breach register for two years." },
];

const timeline = [
  { when: "0 h", what: "You find out about the breach" },
  { when: "72 h", what: "Tell the Commissioner, if it is notifiable" },
  { when: "+7 days", what: "Tell the people affected, if harm is likely" },
  { when: "+30 days", what: "Send any information that was missing" },
];

const roles = [
  { who: "Staff", does: "Report a breach and follow their tasks." },
  { who: "Data protection lead", does: "Keep the data list, assess breaches and prepare notices." },
  { who: "Manager", does: "Approve notices and see every deadline at a glance." },
];

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

      <header className="absolute inset-x-0 top-0 z-40 text-white">
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

        {/* Drag to explore */}
        <section id="data" className="scroll-mt-20 border-t border-rule bg-sheet">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
            <Reveal>
              <h2 className="max-w-3xl font-bold leading-[1.02] tracking-[-0.02em]" style={{ fontSize: "clamp(2.2rem, 5vw, 4.2rem)" }}>
                You hold more personal data than you think.
              </h2>
              <p className="mt-5 max-w-xl text-lg text-muted">
                When a breach happens, the first question is what was exposed. Explore the data a
                typical small business keeps, often without noticing.
              </p>
            </Reveal>
            <Reveal className="mt-10" delay={120}>
              <DataBoard />
            </Reveal>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-t border-rule bg-paper">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
            <Reveal>
              <h2 className="font-bold leading-[1.02] tracking-[-0.02em]" style={{ fontSize: "clamp(2.2rem, 5vw, 4.2rem)" }}>
                Four steps, one record.
              </h2>
            </Reveal>
            <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.title}>
                  <Reveal delay={i * 110} className="h-full">
                    <div className="h-full rounded-xl border border-rule bg-sheet p-6">
                      <span className="grid size-10 place-items-center rounded-full bg-ink text-lg font-bold text-white tabular-nums">{i + 1}</span>
                      <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
                      <p className="mt-2 text-muted">{s.body}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>

            <Reveal className="mt-14">
              <div className="rounded-xl border border-rule bg-sheet p-6 sm:p-8">
                <h3 className="text-lg font-bold">The deadlines the tracker counts for you</h3>
                <ol className="relative mt-6 grid gap-6 md:grid-cols-4 md:gap-4">
                  <span className="absolute bottom-2 left-[7px] top-2 w-0.5 bg-rule md:bottom-auto md:left-2 md:right-2 md:top-[7px] md:h-0.5 md:w-auto" aria-hidden="true" />
                  {timeline.map((t, i) => (
                    <li key={t.when} className="relative pl-8 md:pl-0 md:pt-8">
                      <span className={`absolute left-0 top-1 size-4 rounded-full border-[3px] md:top-0 ${i === 1 ? "border-stamp bg-stamp" : "border-ink bg-sheet"}`} aria-hidden="true" />
                      <p className="text-xl font-bold tabular-nums">{t.when}</p>
                      <p className="mt-1 text-[0.95rem] text-muted">{t.what}</p>
                    </li>
                  ))}
                </ol>
                <p className="mt-7 max-w-3xl text-sm text-muted">
                  Every breach goes in the register, even one you do not notify. Source: Personal
                  Data Protection Guideline on Data Breach Notification (2025).
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Who uses it */}
        <section className="border-t border-rule bg-sheet">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_2fr]">
            <Reveal>
              <h2 className="text-3xl font-bold tracking-[-0.01em] sm:text-4xl">Three roles. Each sees only what their job needs.</h2>
            </Reveal>
            <ul className="grid gap-5 sm:grid-cols-3">
              {roles.map((r, i) => (
                <li key={r.who}>
                  <Reveal delay={i * 100}>
                    <div className="border-t-2 border-ink pt-4"><p className="text-lg font-bold">{r.who}</p>
                    <p className="mt-2 text-muted">{r.does}</p></div>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Closing */}
        <section className="relative isolate overflow-hidden border-t border-ink bg-ink text-white">
          <div className="mx-auto max-w-7xl px-5 py-28 text-center sm:px-8">
            <Reveal>
              <h2 className="mx-auto max-w-4xl font-bold leading-[1.0] tracking-[-0.03em]" style={{ fontSize: "clamp(2.4rem, 6vw, 5.4rem)" }}>
                Be ready before the next breach.
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-lg text-white/75">
                Sign in with the Google account your manager invited.
              </p>
              <Link href="/sign-in" className="mt-9 inline-flex rounded-md bg-white px-7 py-3.5 text-lg font-bold text-ink hover:bg-paper">
                Sign in with Google
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule bg-sheet">
        <div className="mx-auto max-w-7xl px-5 py-8 text-sm text-muted sm:px-8">
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
