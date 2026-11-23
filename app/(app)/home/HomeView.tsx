import Link from "next/link";
import type { CurrentUser } from "@/lib/auth";
import PageHeader from "@/components/app/PageHeader";
import Icon, { type IconName } from "@/components/app/hub/icons";
import { Bars, Card, Empty } from "@/components/app/hub/ui";
import CountUp from "@/components/app/hub/CountUp";
import ClockExplorer from "@/components/app/hub/ClockExplorer";
import IncidentSteps from "@/components/app/hub/IncidentSteps";
import { describeChange } from "@/lib/activity";
import Pending from "@/components/app/hub/Pending";
import type { HomeData } from "./page";

const kl = new Intl.DateTimeFormat("en-MY", { weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kuala_Lumpur" });
const STEP: Record<string, number> = { reported: 0, assessing: 1, decided: 2, notified: 3, follow_up: 3, closed: 4 };
const STATUS_LABEL: Record<string, string> = { reported: "Reported", assessing: "Assessing", decided: "Decided", notified: "Notified", follow_up: "Follow-up", closed: "Closed" };
// One colour per person in the activity log, picked from their name.
const AV = ["#2855ff", "#ff6b4d", "#13206b", "#7b61ff", "#c2410c"];
const avColour = (name: string) => AV[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % AV.length];

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
  const tabs: { href: string; icon: IconName; title: string; sub: string; current?: boolean; metric?: [string, string] }[] =
    me.role === "staff"
      ? [
          { href: "/home", icon: "home", title: "Overview", sub: "Today", current: true, metric: ["open", String(open.length)] },
          { href: "/report", icon: "plus", title: "Report", sub: "About 2 minutes" },
          { href: "/my-reports", icon: "inbox", title: "My reports", sub: `${open.length} open` },
          { href: "/tasks", icon: "check", title: "My tasks", sub: `${d.tasks.length} to do` },
        ]
      : [
          { href: "/home", icon: "home", title: "Overview", sub: "Today", current: true, metric: ["open", String(open.length)] },
          ...open.slice(0, 2).map((i) => ({ href: "/incidents", icon: "alert" as IconName, title: i.code, sub: STATUS_LABEL[i.status] ?? i.status })),
          { href: "/inventory", icon: "db", title: "Inventory", sub: `${d.sets} data place${d.sets === 1 ? "" : "s"}` },
          { href: "/register", icon: "book", title: "Register", sub: "Kept 2 years" },
        ];

  const waitH = d.oldestDraft ? Math.floor((now - new Date(d.oldestDraft).getTime()) / 3.6e6) : 0;
  const unassessed = open.filter((i) => i.status === "reported").length;
  const top = open[0];

  const side = panel === "ai" ? "ai" : "feed";
  const feedTitle = me.role === "manager" ? "Activity log" : "Alerts";

  return (
    <>
      <PageHeader title={greeting.t} intro={greeting.p} eyebrow={me.orgName} big art>
        <span className="hub-pill-light">Role: <b>{me.role === "dp_lead" ? "Compliance Officer" : me.role === "manager" ? "Manager" : "Staff"}</b></span>
        <span className="hub-pill-light">Status: {d.deadline ? <b className="warn">Clock running</b> : <b className="ok">All clear</b>}</span>
      </PageHeader>

      <nav className="hub-tabs" aria-label="Quick places">
        {tabs.map((t) => (
          <Link key={t.title + t.href} href={t.href} className="hub-tab" aria-current={t.current ? "true" : undefined}>
            <span className="ic"><Icon name={t.icon} /></span>
            <span style={{ minWidth: 0 }}><b>{t.title}</b><small>{t.sub}</small></span>
            {t.metric && <span className="metric"><b>{t.metric[1]}</b> {t.metric[0]}</span>}
            <Pending />
          </Link>
        ))}
      </nav>

      <main id="main" className="hub-main">
        <div className="hub-grid">
          {me.role === "staff" ? (
            <>
              <Card tour="report" icon="plus" title="Report a breach" sub="Lost, sent to the wrong person, or seen by someone who shouldn't" className="" delay={0.05}>
                <p className="hub-big" style={{ fontSize: 34 }}>Something happened?</p>
                <Link href="/report" className="hub-btn">Report it now →<Pending /></Link>
              </Card>
              <Card icon="inbox" title="My reports" sub="What happened after you reported" href="/my-reports" delay={0.12}>
                {open.length ? <p className="hub-big"><CountUp value={open.length} /><small>open</small></p> : <Empty icon="inbox" title="Nothing reported" body="Reports you make will show their progress here." />}
              </Card>
              <Card icon="check" title="My tasks" sub="Given to you during a breach" href="/tasks" delay={0.19}>
                {d.tasks.length ? <TaskRows tasks={d.tasks} /> : <Empty icon="check" title="No tasks" body="Nothing has been given to you. You're all clear." />}
              </Card>
            </>
          ) : (
            <>
              <Card tour="clock" icon="clock" title="72-hour clock" sub={d.deadline ? `${d.deadline.incidents?.code} · due ${kl.format(new Date(d.deadline.due_at))}` : "Commissioner deadline"} href={d.deadline ? "/incidents" : undefined} delay={0.05}>
                {d.deadline ? (
                  <>
                    <p className="hub-big"><CountUp value={Math.floor(hoursUsed)} /><small>h used</small><span className="hub-dot warn">!</span></p>
                    {d.deadline.incidents ? (
                      <ClockExplorer code={d.deadline.incidents.code} awareAt={d.deadline.incidents.aware_at} deadlines={d.deadline.incidents.deadlines ?? []} />
                    ) : (
                      <Bars n={72} on={Math.floor(hoursUsed)} hotFrom={48} />
                    )}
                  </>
                ) : (
                  <Empty icon="clock" title="No clock running" body="When a breach is reported, its 72-hour countdown starts here." />
                )}
              </Card>

              {me.role === "manager" ? (
                <Card tour="approve" icon="stamp" title="Waiting for you" sub="Notice drafts to approve" href="/approvals" delay={0.12}>
                  {d.approvals ? (
                    <>
                      <p className="hub-big"><CountUp value={d.approvals} /><small>to approve</small><span className="hub-dot warn">!</span></p>
                      <div className="hub-legend"><span>Oldest waiting {waitH} h</span><span>72 h</span></div>
                      <Bars n={72} on={Math.min(72, waitH)} hotFrom={24} />
                    </>
                  ) : (
                    <Empty icon="stamp" title="Nothing to approve" body="Notice drafts wait here for you. The clock keeps running while they wait." />
                  )}
                </Card>
              ) : (
                <Card tour="inventory" icon="db" title="Data inventory" sub="Where personal data is kept" href="/inventory" delay={0.12}>
                  {d.sets ? (
                    <>
                      <p className="hub-big"><CountUp value={d.sets} /><small>place{d.sets === 1 ? "" : "s"}</small></p>
                      <div className="hub-legend"><span>Sensitive fields: {d.fieldSensitive}</span><span>All fields: {d.fieldTotal}</span></div>
                      <Bars n={48} on={d.fieldTotal ? Math.round((d.fieldSensitive / d.fieldTotal) * 48) : 0} />
                    </>
                  ) : (
                    <Empty icon="db" title="Start your inventory" body="List where personal data lives. Incidents start from this list." href="/inventory" cta="Add a data place" />
                  )}
                </Card>
              )}

              {me.role === "manager" ? (
                <Card icon="users" title="Your team" sub="People and roles" href="/users" delay={0.19}>
                  <p className="hub-big"><CountUp value={d.people} /><small>active</small><span className="hub-dot g">✓</span></p>
                  <div className="hub-legend"><span>Active</span><span>{d.invites} invite{d.invites === 1 ? "" : "s"} pending</span></div>
                  <Bars n={48} on={Math.round((d.people / Math.max(1, d.people + d.invites)) * 48)} />
                </Card>
              ) : (
                <Card icon="alert" title="Open incidents" sub="Not closed yet" href="/incidents" delay={0.19}>
                  {open.length ? (
                    <>
                      <p className="hub-big"><CountUp value={open.length} /><small>open</small></p>
                      <div className="hub-legend"><span>Not assessed yet: {unassessed}</span><span>Open: {open.length}</span></div>
                      <Bars n={48} on={Math.round((unassessed / open.length) * 48)} />
                    </>
                  ) : <Empty icon="alert" title="No open incidents" body="Nothing to respond to right now." href="/report" cta="Report a breach" />}
                </Card>
              )}
            </>
          )}

          {/* right column: alerts or activity, plus the AI helper tab (coming soon) */}
          <section className="hub-card hub-side" style={{ animationDelay: ".26s" }} data-tour="side">
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
                        <div key={a.id} className="hub-msg">
                          <span className="hub-av" aria-hidden="true" style={{ background: a.actor === "System" ? "#9aa1b8" : avColour(a.actor) }}>{a.actor.charAt(0)}</span>
                          <div><span className="meta"><b>{a.actor}</b><time>{kl.format(new Date(a.created_at))}</time></span><p>{describeChange(a.table_name, a.action)}</p></div>
                        </div>
                      ))
                    : <Empty icon="list" title="Quiet so far" body="Every change anyone makes is listed here, and can never be edited." />
                  : d.alerts.length
                    ? d.alerts.map((a) => (
                        <div key={a.id} className={`hub-msg${a.level !== "info" ? " alert" : ""}`}>
                          <span className="hub-av" aria-hidden="true">!</span>
                          <div><span className="meta"><b>{a.level !== "info" ? "Deadline" : "Reminder"}</b><time>{kl.format(new Date(a.created_at))}</time></span><p>{a.message}</p></div>
                        </div>
                      ))
                    : <Empty icon="bell" title="No alerts" body="You'll be reminded 24 hours and 6 hours before a deadline." />}
              </div>
            )}
            <div className="hub-switch">
              <Link href="/home" aria-current={side === "feed" ? "true" : undefined}>{feedTitle}</Link>
              <Link href="/home?panel=ai" aria-current={side === "ai" ? "true" : undefined}>AI helper <span className="hub-tag" style={{ marginLeft: 4 }}>Soon</span></Link>
            </div>
          </section>

          {me.role !== "staff" && (
            <>
              <Card tour="progress" className="wide" icon="alert" title="Incident progress" sub={top ? `${top.code} · ${top.title}` : "The four steps of every breach"} href={top ? "/incidents" : undefined} delay={0.33}>
                {top ? (
                  <>
                    <div className="hub-figs">
                      <p className="hub-big">{top.people !== null ? <CountUp value={top.people} /> : "?"}<small>people affected</small></p>
                      <dl>
                        <div><dt>Data places</dt><dd>{top.places}</dd></div>
                        <div><dt>Stage</dt><dd>{STATUS_LABEL[top.status] ?? top.status}</dd></div>
                      </dl>
                    </div>
                    <IncidentSteps at={Math.min(3, STEP[top.status] ?? 0)} dates={[top.reportedAt, top.assessedAt, top.notifiedAt, null]} />
                  </>
                ) : (
                  <>
                    <p className="muted" style={{ fontSize: 13, margin: "14px 0 4px" }}>No open incident. Click a step to see how every breach is handled.</p>
                    <IncidentSteps at={null} />
                  </>
                )}
              </Card>
              <Card icon="check" title={me.role === "manager" ? "Open tasks" : "Tasks"} sub="Follow-up work during a breach" href="/tasks" className="wide" delay={0.4}>
                {d.tasks.length ? <TaskRows tasks={d.tasks} /> : <Empty icon="check" title="No open tasks" body="Tasks given during an incident appear here with their owner and due date." />}
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

