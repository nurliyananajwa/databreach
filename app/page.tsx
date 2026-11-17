import Link from "next/link";
import ResponseClock from "@/components/ResponseClock";

const problems = [
  {
    title: "You don't know what data you hold.",
    body: "The official form asks what types of personal data were affected and how many people. Without a record of your customer lists, payroll and staff files, every hour spent finding out comes out of the 72.",
  },
  {
    title: "The decision is hard to make and harder to justify.",
    body: "Whether to tell the Commissioner, the affected people, or no one depends on the scale and the likely harm. Most small businesses have no legal staff to work through the criteria or write down why.",
  },
  {
    title: "Deadlines and records get lost.",
    body: "News of a breach travels by WhatsApp and email. Three linked deadlines slip, and the breach register you must keep for two years ends up incomplete.",
  },
];

const steps = [
  {
    title: "Record your data",
    body: "List each set of personal data you hold, where it is kept and who can open it. You record field names only, such as Phone number, never the data itself.",
  },
  {
    title: "Report and assess",
    body: "Any staff member reports a breach on one short form. Your data protection lead confirms what was exposed, and each criterion is shown as met or not met, with the reason.",
  },
  {
    title: "Notify and keep the proof",
    body: "The system counts down each deadline and prepares the official form for your manager to approve. You send it, record it, and every step stays in the register.",
  },
];

const timeline = [
  { when: "0 h", what: "Your business becomes aware of the breach" },
  { when: "72 h", what: "Notify the Commissioner, if the breach is notifiable" },
  { when: "+ 7 days", what: "Notify affected people, if significant harm is likely" },
  { when: "+ 30 days", what: "Send any information that was missing at first" },
];

const features = [
  {
    title: "Personal data inventory",
    body: "Every data set with its owner, storage place, purpose and retention period. Each edit is kept as a new version.",
  },
  {
    title: "Explained assessment",
    body: "The Commissioner's criteria as a clear checklist. You can disagree with a suggestion, but you must give a reason.",
  },
  {
    title: "Deadlines and approval",
    body: "In-app alerts when 24 hours and 6 hours are left. Only a manager can approve a notification draft.",
  },
  {
    title: "Protected breach register",
    body: "Every breach, including those you did not notify, kept for at least two years with a full audit trail.",
  },
];

function SignInButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/sign-in"
      className={`inline-flex items-center justify-center rounded-md bg-ink px-5 py-3 font-bold text-white hover:bg-[#25335a] ${className}`}
    >
      Sign in with Google
    </Link>
  );
}

export default function LandingPage() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-sheet focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      <header className="border-b border-rule">
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-6xl items-center gap-x-4 gap-y-3 sm:gap-x-8 px-5 py-4 sm:px-8"
        >
          <Link href="/" className="mr-auto flex items-center gap-2.5 font-bold leading-tight">
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
              <rect x="3" y="2.5" width="16" height="19" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M7 8h8M7 12h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="17" cy="17" r="5" fill="var(--color-stamp)" />
              <path d="M17 14.6V17l1.6 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            </svg>
            PDPA Breach Response Tracker
          </Link>
          <ul className="hidden items-center gap-7 text-[0.95rem] md:flex">
            <li><a href="#problem" className="hover:underline underline-offset-4">The problem</a></li>
            <li><a href="#how" className="hover:underline underline-offset-4">How it works</a></li>
            <li><a href="#features" className="hover:underline underline-offset-4">Features</a></li>
          </ul>
          <Link
            href="/sign-in"
            className="shrink-0 whitespace-nowrap rounded-md border-2 border-ink px-4 py-1.5 text-[0.95rem] font-bold hover:bg-ink hover:text-white"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:pt-20">
          <div>
            <h1
              className="font-bold leading-[1.02] tracking-[-0.02em]"
              style={{ fontSize: "clamp(2.3rem, 4.6vw, 4rem)" }}
            >
              <span className="block">Know your data.</span>
              <span className="block whitespace-nowrap">Meet the 72 hours.</span>
              <span className="block">Keep the proof.</span>
            </h1>
            <p className="mt-7 max-w-[34rem] text-lg text-muted">
              Since 1 June 2025, a Malaysian business must tell the Personal Data Protection
              Commissioner about a notifiable data breach within 72 hours. This tracker helps small
              businesses respond on time and record every decision.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <SignInButton />
              <a href="#how" className="font-bold underline decoration-rule decoration-2 underline-offset-4 hover:decoration-ink">
                See how it works
              </a>
            </div>
          </div>

          <ResponseClock />
        </section>

        {/* The problem */}
        <section id="problem" className="scroll-mt-6 border-t border-rule bg-sheet">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <h2 className="max-w-2xl text-3xl font-bold leading-tight tracking-[-0.01em] sm:text-4xl">
              When a breach happens, most small businesses are working from email and memory.
            </h2>
            <ul className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {problems.map((p) => (
                <li key={p.title} className="border-l-[3px] border-stamp pl-5">
                  <h3 className="text-lg font-bold leading-snug">{p.title}</h3>
                  <p className="mt-2 text-muted">{p.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-6 border-t border-rule">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <h2 className="text-3xl font-bold tracking-[-0.01em] sm:text-4xl">How it works</h2>
            <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {steps.map((s, i) => (
                <li key={s.title}>
                  <span className="grid size-10 place-items-center rounded-full border-2 border-ink text-lg font-bold tabular-nums">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-muted">{s.body}</p>
                </li>
              ))}
            </ol>

            <div className="mt-16 rounded-md border border-rule bg-sheet p-6 sm:p-8">
              <h3 className="text-lg font-bold">The deadlines the tracker counts for you</h3>
              <ol className="relative mt-6 grid gap-6 md:grid-cols-4 md:gap-4">
                <span
                  className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-rule md:left-2 md:right-2 md:top-[7px] md:bottom-auto md:h-0.5 md:w-auto"
                  aria-hidden="true"
                />
                {timeline.map((t, i) => (
                  <li key={t.when} className="relative pl-8 md:pl-0 md:pt-8">
                    <span
                      className={`absolute left-0 top-1 size-4 rounded-full border-[3px] md:top-0 ${
                        i === 1 ? "border-stamp bg-stamp" : "border-ink bg-sheet"
                      }`}
                      aria-hidden="true"
                    />
                    <p className="text-xl font-bold tabular-nums">{t.when}</p>
                    <p className="mt-1 text-[0.95rem] text-muted">{t.what}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-7 max-w-3xl text-sm text-muted">
                Every breach goes in the register, even one you don&rsquo;t notify. A breach that
                affects more than 1,000 people is treated as significant in scale. Source: Personal
                Data Protection Guideline on Data Breach Notification (2025).
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-6 border-t border-rule bg-sheet">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="text-3xl font-bold tracking-[-0.01em] sm:text-4xl">What&rsquo;s inside</h2>
              <p className="mt-4 max-w-sm text-muted">
                Three roles, each seeing only what their job needs: staff report, the data
                protection lead responds, the manager approves and oversees.
              </p>
            </div>
            <dl className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
              {features.map((f) => (
                <div key={f.title} className="border-t-2 border-ink pt-4">
                  <dt className="text-lg font-bold">{f.title}</dt>
                  <dd className="mt-2 text-muted">{f.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="border-t border-rule">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-5 py-20 sm:px-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-[-0.01em] sm:text-4xl">Be ready before a breach happens.</h2>
              <p className="mt-3 max-w-xl text-muted">
                Sign in with the Google account your manager invited. New accounts see nothing
                until they are invited.
              </p>
            </div>
            <SignInButton className="shrink-0" />
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto max-w-6xl px-5 py-8 text-sm text-muted sm:px-8">
          <p className="max-w-3xl">
            Academic prototype for IMS568, Faculty of Information Science, UiTM Puncak Perdana. It
            uses fictional data only. It does not give legal advice and never sends notifications:
            your business decides and sends them.
          </p>
        </div>
      </footer>
    </>
  );
}
