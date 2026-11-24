import Link from "next/link";
import { requirePage, titleFor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/app/PageHeader";
import type { Tab } from "@/components/app/PageTabs";
import Icon from "@/components/app/hub/icons";
import { Empty } from "@/components/app/hub/ui";
import { TYPE_LABEL, type IncidentType } from "@/lib/incidents";

export const generateMetadata = titleFor("/my-reports", "My reports");

const kl = new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kuala_Lumpur" });
// What each stage means for the person who reported it.
const STAGES = [
  { key: "reported", label: "Reported", now: "Waiting for the Compliance Officer to look at it" },
  { key: "assessing", label: "Being checked", now: "The Compliance Officer is checking what data was exposed" },
  { key: "decided", label: "Decided", now: "A decision has been made on who must be told" },
  { key: "notified", label: "Notified", now: "The people who had to be told have been told" },
  { key: "closed", label: "Closed", now: "Nothing more to do" },
] as const;
const stageIndex = (s: string) => (s === "follow_up" ? 3 : Math.max(0, STAGES.findIndex((x) => x.key === s)));

type Row = { id: string; code: string; title: string; status: string; incident_type: IncidentType; reported_at: string };

export default async function Page({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const db = await createClient();
  const [me, sp] = await Promise.all([requirePage("/my-reports"), searchParams]);
  // Only your own reports (RLS also allows nothing else for Staff).
  const { data } = await db.from("incidents").select("id, code, title, status, incident_type, reported_at")
    .eq("reported_by", me.id).order("reported_at", { ascending: false });
  const rows = (data ?? []) as Row[];
  const closedView = sp.view === "closed";
  const open = rows.filter((r) => r.status !== "closed");
  const closed = rows.filter((r) => r.status === "closed");
  const shown = closedView ? closed : open;

  const tabs: Tab[] = [
    { href: "/my-reports", icon: "inbox", title: "Open", sub: `${open.length} in progress`, current: !closedView },
    { href: "/my-reports?view=closed", icon: "check", title: "Closed", sub: `${closed.length} finished`, current: closedView },
  ];

  return (
    <>
      <PageHeader tabs={tabs} title="My reports" intro="The breaches you reported and where each one is now. Only you see this list."
        action={{ href: "/report", label: "Report a breach" }} />
      <main id="main" className="hub-main">
        <section className="hub-card hub-view" aria-labelledby="mr-h">
          <div className="hub-ch"><div>
            <h2 id="mr-h"><Icon name="inbox" />{closedView ? "Closed reports" : "Reports in progress"}</h2>
            <p className="sub">{closedView ? "Kept for at least two years" : "The Compliance Officer moves each one forward"}</p>
          </div></div>
          {shown.length === 0 ? (
            <Empty icon="inbox" title={closedView ? "Nothing closed yet" : "Nothing in progress"}
              body={closedView ? "Reports appear here once the Compliance Officer closes them." : "Reports you send appear here, with what is happening to them."} />
          ) : (
            <ul className="mr-list">
              {shown.map((r) => {
                const at = stageIndex(r.status);
                return (
                  <li key={r.id}>
                    <div className="mr-top">
                      <span className="code">{r.code}</span>
                      <b>{r.title}</b>
                      <span className="mr-type">{TYPE_LABEL[r.incident_type] ?? r.incident_type}</span>
                    </div>
                    <ol className="mr-steps" aria-label={`Stage: ${STAGES[at].label}`}>
                      {STAGES.map((s, i) => <li key={s.key} className={i < at ? "done" : i === at ? "now" : undefined}>{s.label}</li>)}
                    </ol>
                    <p className="mr-now">{STAGES[at].now}. <span>Reported {kl.format(new Date(r.reported_at))}</span></p>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/report" className="hub-back">Report another breach</Link>
        </section>
      </main>
    </>
  );
}
