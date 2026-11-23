import Link from "next/link";
import type { CurrentUser } from "@/lib/auth";
import PageHeader from "@/components/app/PageHeader";
import Icon, { type IconName } from "@/components/app/hub/icons";
import { Bars, Card, Empty } from "@/components/app/hub/ui";
import type { HomeData } from "./page";

const kl = new Intl.DateTimeFormat("en-MY", { weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kuala_Lumpur" });
const STEP: Record<string, number> = { reported: 0, assessing: 1, decided: 2, notified: 3, follow_up: 3, closed: 4 };
const STEPS = ["Locate", "Assess", "Notify", "Record"];
const AUDIT_WORDS: Record<string, string> = {
  organisations: "organisation setting", data_sets: "data place", data_fields: "data field", incidents: "incident", decisions: "decision", notifications: "notice",
  tasks: "task", profiles: "user", invitations: "invitation", assessments: "assessment", deadlines: "deadline",
};
const ACTION: Record<string, string> = { insert: "added", update: "changed", delete: "removed" };

export default function HomeView({ me, d, panel }: { me: CurrentUser; d: HomeData; panel?: string }) {
  const first = me.fullName.split(" ")[0];
  const open = d.incidents;

  // ---- the running clock (most urgent open incident) ----
  const now = Date.now();
  const hoursLeft = d.deadline ? Math.max(0, (new Date(d.deadline.due_at).getTime() - now) / 3.6e6) : null;
  const hoursUsed = hoursLeft === null ? 0 : Math.min(72, 72 - hoursLeft);

  const greeting =
    me.role === "staff"
      ? { t: `Hello, ${first}.`, p: "Something wrong with personal data? Report it straight away, even if you are not sure. The Compliance Officer takes it from there." }
      : d.deadline
        ? { t: `${d.deadline.incidents?.code} needs attention.`, p: `${Math.floor(hoursLeft!)} hours left to notify the Commissioner. Open the incident to continue.` }
        : { t: "Breach Response Hub", p: open.length ? `${open.length} open incident${open.length > 1 ? "s" : ""}, no deadline running right now.` : `Hello, ${first}. No open incidents. A good time to keep your data inventory up to date.` };

  // ---- folder tabs: open incidents first, then the main places ----
  const tabs: { href: string; icon: IconName; title: string; sub: string; current?: boolean }[] =
    me.role === "staff"
      ? [
          { href: "/home", icon: "home", title: "Overview", sub: me.orgName, current: true },
          { href: "/report", icon: "plus", title: "Report", sub: "About 2 minutes" },
          { href: "/my-reports", icon: "inbox", title: "My reports", sub: `${open.length} open` },
          { href: "/tasks", icon: "check", title: "My tasks", sub: `${d.tasks.length} to do` },
        ]
      : [
          { href: "/home", icon: "home", title: "Overview", sub: me.orgName, current: true },
          ...open.slice(0, 2).map((i) => ({ href: "/incidents", icon: "alert" as IconName, title: i.code, sub: i.title })),
          { href: "/inventory", icon: "db", title: "Inventory", sub: `${d.sets} data place${d.sets === 1 ? "" : "s"}` },
          { href: "/register", icon: "book", title: "Register", sub: "Kept 2 years" },
        ];

  const side = panel === "ai" ? "ai" : "feed";
  const feedTitle = me.role === "manager" ? "Activity log" : "Alerts";

  return (
    <>
      <PageHeader title={greeting.t} intro={greeting.p} eyebrow={me.orgName} big art>
        <span className="hub-pill-light">Role: <b>{me.role === "dp_lead" ? "Compliance Officer" : me.role === "manager" ? "Manager" : "Staff"}</b></span>
        {me.role !== "staff" && <span className="hub-pill-light">Open: <b>{open.length} incident{open.length === 1 ? "" : "s"}</b></span>}
      </PageHeader>

      <nav className="hub-tabs" aria-label="Quick places">
        {tabs.map((t) => (
          <Link key={t.title + t.href} href={t.href} className="hub-tab" aria-current={t.current ? "true" : undefined}>
            <span className="ic"><Icon name={t.icon} /></span>
            <span style={{ minWidth: 0 }}><b>{t.title}</b><small>{t.sub}</small></span>
          </Link>
        ))}
      </nav>

      <main id="main" className="hub-main">
        <div className="hub-grid">
          {me.role === "staff" ? (
            <>
              <Card icon="plus" title="Report a breach" sub="Lost, sent to the wrong person, or seen by someone who shouldn't" className="" delay={0.05}>
                <p className="hub-big" style={{ fontSize: 34 }}>Something happened?</p>
                <Link href="/report" className="hub-btn">Report it now →</Link>
              </Card>
              <Card icon="inbox" title="My reports" sub="What happened after you reported" href="/my-reports" delay={0.12}>
                {open.length ? <p className="hub-big">{open.length}<small>open</small></p> : <Empty title="Nothing reported" body="Reports you make will show their progress here." />}
              </Card>
              <Card icon="check" title="My tasks" sub="Given to you during a breach" href="/tasks" delay={0.19}>
                {d.tasks.length ? <TaskRows tasks={d.tasks} /> : <Empty title="No tasks" body="You're all clear." />}
              </Card>
            </>
          ) : (
            <>
              <Card icon="clock" title="72-hour clock" sub={d.deadline ? `${d.deadline.incidents?.code} · due ${kl.format(new Date(d.deadline.due_at))}` : "Commissioner deadline"} href={d.deadline ? "/incidents" : undefined} delay={0.05}>
                {d.deadline ? (
                  <>
                    <p className="hub-big">{Math.floor(hoursUsed)}<small>h used</small><span className={`hub-dot ${hoursUsed >= 48 ? "r" : "a"}`}>!</span></p>
                    <div className="hub-legend"><span>{Math.floor(hoursLeft!)} h left</span><span>72 h</span></div>
                    <Bars n={72} on={Math.floor(hoursUsed)} hotFrom={48} />
                  </>
                ) : (
                  <Empty title="No clock running" body="When a breach is reported, its 72-hour countdown appears here." />
                )}
              </Card>

              {me.role === "manager" ? (
                <Card icon="stamp" title="Waiting for you" sub="Notice drafts to approve" href="/approvals" delay={0.12}>
                  {d.approvals ? (
                    <p className="hub-big">{d.approvals}<small>to approve</small><span className="hub-dot r">!</span></p>
                  ) : (
                    <Empty title="Nothing to approve" body="Notice drafts appear here. The clock keeps running while they wait." />
                  )}
                </Card>
              ) : (
                <Card icon="db" title="Data inventory" sub="Where personal data is kept" href="/inventory" delay={0.12}>
                  {d.sets ? (
                    <>
                      <p className="hub-big">{d.sets}<small>place{d.sets === 1 ? "" : "s"}</small></p>
                      <div className="hub-legend"><span>Sensitive fields: {d.fieldSensitive}</span><span>All fields: {d.fieldTotal}</span></div>
                      <Bars n={48} on={d.fieldTotal ? Math.round((d.fieldSensitive / d.fieldTotal) * 48) : 0} tone="hot" />
                    </>
                  ) : (
                    <Empty title="Start your inventory" body="List where personal data lives. Incidents start from this list." href="/inventory" cta="Add a data place" />
                  )}
                </Card>
              )}

              {me.role === "manager" ? (
                <Card icon="users" title="Your team" sub="Invited people and their roles" href="/users" delay={0.19}>
                  <p className="hub-big">{d.people}<small>active</small><span className="hub-dot g">✓</span></p>
                  <div className="hub-legend"><span>Active</span><span>{d.invites} invite{d.invites === 1 ? "" : "s"} pending</span></div>
                  <Bars n={48} on={Math.round((d.people / Math.max(1, d.people + d.invites)) * 48)} tone="ok" />
                </Card>
              ) : (
                <Card icon="alert" title="Open incidents" sub="Not closed yet" href="/incidents" delay={0.19}>
                  {open.length ? <p className="hub-big">{open.length}<small>open</small></p> : <Empty title="No open incidents" body="You're all clear." />}
                </Card>
              )}
            </>
          )}

          {/* right column: alerts or activity, plus the AI helper tab (coming soon) */}
          <section className="hub-card hub-side" style={{ animationDelay: ".26s" }}>
            <div className="hub-ch">
              <div>
                <h2><Icon name={side === "ai" ? "log" : me.role === "manager" ? "list" : "bell"} />{side === "ai" ? "AI report helper" : feedTitle}</h2>
                <p className="sub">{side === "ai" ? "Coming soon" : me.role === "manager" ? "Every change, saved and locked" : "Deadlines and reminders for you"}</p>
              </div>
              {side === "feed" && me.role === "manager" && <Link href="/audit" className="hub-go" aria-label="Open the audit log"><Icon name="arrow" className="size-4" /></Link>}
            </div>
            {side === "ai" ? (
              <div className="hub-soon">
                <span className="ic"><Icon name="log" /></span>
                <strong>Coming soon</strong>
                <p>Suggests the incident type and the data places involved from a staff report. A person always confirms.</p>
              </div>
            ) : (
              <div className="hub-feed">
                {me.role === "manager"
                  ? d.audit.length
                    ? d.audit.map((a) => (
                        <div key={a.id} className="hub-msg"><span className="hub-av" aria-hidden="true">{a.actor.charAt(0)}</span><p><b style={{ fontWeight: 600 }}>{a.actor}</b> {ACTION[a.action] ?? a.action} {article(AUDIT_WORDS[a.table_name] ?? a.table_name)}</p><time>{kl.format(new Date(a.created_at))}</time></div>
                      ))
                    : <Empty title="Quiet so far" body="Every change anyone makes will be listed here." />
                  : d.alerts.length
                    ? d.alerts.map((a) => (
                        <div key={a.id} className={`hub-msg${a.level !== "info" ? " alert" : ""}`}><span className="hub-av" aria-hidden="true">!</span><p>{a.message}</p><time>{kl.format(new Date(a.created_at))}</time></div>
                      ))
                    : <Empty title="No alerts" body="You'll be reminded 24 hours and 6 hours before a deadline." />}
              </div>
            )}
            <div className="hub-switch">
              <Link href="/home" aria-current={side === "feed" ? "true" : undefined}>{feedTitle}</Link>
              <Link href="/home?panel=ai" aria-current={side === "ai" ? "true" : undefined}>AI helper <span className="hub-tag" style={{ marginLeft: 4 }}>Soon</span></Link>
            </div>
          </section>

          {me.role !== "staff" && (
            <>
              <Card icon="alert" title="Incident progress" sub={open[0] ? `${open[0].code} · ${open[0].title}` : "The four steps of every breach"} href={open[0] ? "/incidents" : undefined} delay={0.33}>
                <p className="hub-big" style={{ fontSize: 38 }}>{open[0] ? STEPS[Math.min(3, STEP[open[0].status] ?? 0)] : "Ready"}</p>
                <div className="hub-steps">
                  {STEPS.map((s, i) => {
                    const at = open[0] ? STEP[open[0].status] ?? 0 : -1;
                    return (
                      <div key={s}><div className="l"><i style={{ width: i < at ? "100%" : i === at ? "50%" : "0%", background: i < at ? "var(--ink)" : undefined }} /></div><small>{i + 1}. {s}</small></div>
                    );
                  })}
                </div>
              </Card>
              <Card icon="check" title={me.role === "manager" ? "Open tasks" : "Tasks"} sub="Follow-up work during a breach" href="/tasks" className="span2" delay={0.4}>
                {d.tasks.length ? <TaskRows tasks={d.tasks} /> : <Empty title="No open tasks" body="Tasks given during an incident appear here with their owner and due date." />}
              </Card>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function TaskRows({ tasks }: { tasks: { id: string; title: string; due_at: string | null; incidents: { code: string } | null }[] }) {
  return (
    <div className="hub-rows" style={{ marginTop: 12 }}>
      {tasks.map((t) => {
        const late = t.due_at && new Date(t.due_at).getTime() < Date.now();
        return (
          <div key={t.id}>
            <span><b>{t.title}</b><small>{t.incidents?.code}{t.due_at ? ` · due ${kl.format(new Date(t.due_at))}` : ""}</small></span>
            <span className={`hub-status ${late ? "late" : "prog"}`}>{late ? "Overdue" : "Open"}</span>
          </div>
        );
      })}
    </div>
  );
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const article = (s: string) => (/^[aeiou]/i.test(s) ? "an " : "a ") + s;
