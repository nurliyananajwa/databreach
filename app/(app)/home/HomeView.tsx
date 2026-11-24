import Link from "next/link";
import type { CurrentUser } from "@/lib/auth";
import PageHeader from "@/components/app/PageHeader";
import type { Tab } from "@/components/app/PageTabs";
import Icon, { type IconName } from "@/components/app/hub/icons";
import { Bars, Card, Empty, Meter } from "@/components/app/hub/ui";
import CountUp from "@/components/app/hub/CountUp";
import ClockExplorer from "@/components/app/hub/ClockExplorer";
import IncidentSteps from "@/components/app/hub/IncidentSteps";
import { describeChange } from "@/lib/activity";
import Pending from "@/components/app/hub/Pending";
import type { HomeData } from "./page";
import { firstName } from "@/lib/names";

const kl = new Intl.DateTimeFormat("en-MY", { weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kuala_Lumpur" });
const STEP: Record<string, number> = { reported: 0, assessing: 1, decided: 2, notified: 3, follow_up: 3, closed: 4 };
const STATUS_LABEL: Record<string, string> = { reported: "Reported", assessing: "Assessing", decided: "Decided", notified: "Notified", follow_up: "Follow-up", closed: "Closed" };
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export default function HomeView({ me, d, panel }: { me: CurrentUser; d: HomeData; panel?: string }) {
  const first = firstName(me.fullName);
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
        : { t: `Hello, ${first}.`, p: open.length ? `${open.length} open incident${open.length > 1 ? "s" : ""}, no deadline running right now.` : "No open incidents. A good time to keep your data inventory up to date." };

  const view = panel === "feed" ? "feed" : panel === "ai" ? "ai" : "overview";
  // ---- folder tabs: what is inside Home. The top menu already lists every
  // page, so the tabs show live news instead: one tab per open incident.
  const tabs: Tab[] = [
    { href: "/home", icon: "home", title: "Overview", sub: "Today", current: view === "overview" },
    me.role === "manager"
      ? { href: "/home?panel=feed", icon: "list", title: "Activity log", sub: d.audit.length ? `${d.audit.length} recent` : "Quiet so far", current: view === "feed" }
      : { href: "/home?panel=feed", icon: "bell", title: "Alerts", sub: d.alerts.length ? `${d.alerts.length} unread` : "None unread", current: view === "feed", warn: d.alerts.some((a) => a.level !== "info") },
    { href: "/home?panel=ai", icon: "sparkle", title: "AI helper", sub: "Coming soon", current: view === "ai" },
    ...open.slice(0, 2).map((i) => ({
      href: me.role === "staff" ? "/my-reports" : "/incidents",
      icon: "alert" as IconName, title: i.code, sub: STATUS_LABEL[i.status] ?? i.status,
    })),
  ];

  const waitH = d.oldestDraft ? Math.floor((now - new Date(d.oldestDraft).getTime()) / 3.6e6) : 0;
  const unassessed = open.filter((i) => i.status === "reported").length;
  const top = open[0];

  const feedTitle = me.role === "manager" ? "Activity log" : "Alerts";
  const feedSub = me.role === "manager" ? "Locked: entries can never be edited" : "Deadlines and reminders for you";
  const feed = (max: number) => (
    <div className="hub-ledger">
      {me.role === "manager"
        ? d.audit.length
          ? d.audit.slice(0, max).map((a) => (
              <div key={a.id} className="hub-row">
                <time>{kl.format(new Date(a.created_at))}</time>
                <p><b>{a.actor}</b> {lower(describeChange(a.table_name, a.action))}</p>
              </div>
            ))
          : <Empty icon="list" title="Quiet so far" body="Every change anyone makes is listed here, and can never be edited." />
        : d.alerts.length
          ? d.alerts.slice(0, max).map((a) => (
              <div key={a.id} className={`hub-row${a.level !== "info" ? " urgent" : ""}`}>
                <time>{kl.format(new Date(a.created_at))}</time>
                <p><b>{a.level !== "info" ? "Deadline" : "Reminder"}</b> {a.message}</p>
              </div>
            ))
          : <Empty icon="bell" title="No alerts" body="You'll be reminded 24 hours and 6 hours before a deadline." />}
    </div>
  );

  return (
    <>
      <PageHeader
        title={greeting.t}
        intro={greeting.p}
        eyebrow={me.orgName}
        big
        tabs={tabs}
        ring={d.deadline ? hoursUsed : null}
        action={
          me.role === "staff"
            ? { href: "/report", label: "Report a breach", tour: "report" }
            : d.deadline?.incidents
              ? { href: "/incidents", label: `Open ${d.deadline.incidents.code}`, urgent: true }
              : undefined
        }
        meta={<>
          <span>Signed in as <b>{me.role === "dp_lead" ? "Compliance Officer" : me.role === "manager" ? "Manager" : "Staff"}</b></span>
          <span className={d.deadline ? "warn" : "ok"}>{d.deadline ? "Clock running" : "All clear"}</span>
        </>}
      />


      <main id="main" className="hub-main">
        {view === "feed" ? (
          <section className="hub-card hub-view" aria-labelledby="feed-h">
            <div className="hub-ch"><div>
              <h2 id="feed-h"><Icon name={me.role === "manager" ? "list" : "bell"} />{feedTitle}</h2>
              <p className="sub">{feedSub}</p>
            </div></div>
            {feed(20)}
            {me.role === "manager" && d.audit.length > 0 && <Link href="/audit" className="hub-back">See the full audit log</Link>}
          </section>
        ) : view === "ai" ? (
          <section className="hub-card hub-view" aria-labelledby="ai-h">
            <div className="hub-ch"><div>
              <h2 id="ai-h"><Icon name="sparkle" />AI report helper</h2>
              <p className="sub">Waiting for the supervisor&apos;s approval</p>
            </div></div>
            <div className="hub-soon">
              <span className="ic"><Icon name="log" /></span>
              <strong>Coming soon</strong>
              <p>Suggests the incident type and the data sets involved from a staff report. A person always confirms.</p>
            </div>
          </section>
        ) : (
        <div className="hub-grid">
          {me.role === "staff" ? (
            <>
              <Card icon="inbox" title="My reports" sub="What happened after you reported" href="/my-reports" className="wide" delay={0.12}>
                {open.length ? <p className="hub-big"><CountUp value={open.length} /><small>open</small></p> : <Empty icon="inbox" title="Nothing reported" body="Reports you make will show their progress here." />}
              </Card>
              <Card icon="check" title="My tasks" sub="Given to you during a breach" href="/tasks" className="wide" delay={0.19}>
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
                      <Link href="/approvals" className="hub-btn">Review {d.approvals === 1 ? "the draft" : "drafts"}<Pending /></Link>
                    </>
                  ) : (
                    <Empty icon="stamp" title="Nothing to approve" body="Notice drafts wait here for you. The clock keeps running while they wait." />
                  )}
                </Card>
              ) : (
                <Card tour="inventory" icon="db" title="Data inventory" sub="Where personal data is kept" href="/inventory" delay={0.12}>
                  {d.sets ? (
                    <>
                      <p className="hub-big"><CountUp value={d.sets} /><small>data set{d.sets === 1 ? "" : "s"}</small>{d.noOwner > 0 && <Link href="/inventory" className="inv-flag warn hub-owner-warn">{d.noOwner} without an owner</Link>}</p>
                      <div className="hub-legend"><span>Sensitive fields: {d.fieldSensitive}</span><span>All fields: {d.fieldTotal}</span></div>
                      <Meter value={d.fieldSensitive} max={d.fieldTotal} label={`${d.fieldSensitive} of ${d.fieldTotal} fields are sensitive`} />
                    </>
                  ) : (
                    <Empty icon="db" title="Start your inventory" body="List where personal data lives. Incidents start from this list." href="/inventory" cta="Add a data set" />
                  )}
                </Card>
              )}

              {me.role === "manager" ? (
                <Card icon="users" title="Your team" sub="People and roles" href="/users" delay={0.19}>
                  <p className="hub-big"><CountUp value={d.people} /><small>active</small><span className="hub-dot g">✓</span></p>
                  <div className="hub-legend"><span>Active</span><span>{d.invites} invite{d.invites === 1 ? "" : "s"} pending</span></div>
                  <Meter value={d.people} max={d.people + d.invites} label={`${d.people} active, ${d.invites} invited`} />
                </Card>
              ) : (
                <Card icon="alert" title="Open incidents" sub="Not closed yet" href="/incidents" delay={0.19}>
                  {open.length ? (
                    <>
                      <p className="hub-big"><CountUp value={open.length} /><small>open</small></p>
                      <div className="hub-legend"><span>Not assessed yet: {unassessed}</span><span>Open: {open.length}</span></div>
                      <Meter value={unassessed} max={open.length} label={`${unassessed} of ${open.length} not assessed yet`} />
                    </>
                  ) : <Empty icon="alert" title="No open incidents" body="Nothing to respond to right now." href="/report" cta="Report a breach" />}
                </Card>
              )}
            </>
          )}

          {/* right column: alerts (or, for the Manager, the activity log) */}
          <section className="hub-card hub-side" style={{ animationDelay: ".26s" }} data-tour="side">
            <div className="hub-ch">
              <div>
                <h2><Icon name={me.role === "manager" ? "list" : "bell"} />{feedTitle}</h2>
                <p className="sub">{feedSub}</p>
              </div>
            </div>
            {feed(5)}
            {me.role === "manager" && d.audit.length > 0 && <Link href="/audit" className="hub-back">See the full audit log</Link>}
          </section>

          {me.role !== "staff" && (
            <>
              <Card tour="progress" className="wide" icon="alert" title="Incident progress" sub={top ? `${top.code} · ${top.title}` : "The four steps of every breach"} href={top ? "/incidents" : undefined} delay={0.33}>
                {top ? (
                  <>
                    <div className="hub-figs">
                      <p className="hub-big">{top.people !== null ? <CountUp value={top.people} /> : "?"}<small>people affected</small></p>
                      <dl>
                        <div><dt>Data sets</dt><dd>{top.places}</dd></div>
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
        )}
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

