import { requirePage, type CurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import HomeView from "./HomeView";
import type { Deadline as ClockDeadline } from "@/components/app/hub/ClockExplorer";
import { firstName } from "@/lib/names";

export const metadata = { title: "Home | PDPA Breach Response Tracker" };

type RawIncident = {
  id: string; code: string; title: string; status: string; reported_by: string; reported_at: string; individuals_affected: number | null;
  assessments: { assessed_at: string }[] | null; notifications: { sent_at: string | null }[] | null; incident_data_sets: { count: number }[] | null;
};
const earliest = (xs?: (string | null)[]) => (xs ?? []).filter((x): x is string => !!x).sort()[0] ?? null;

type Deadline = { due_at: string; incidents: { id: string; code: string; title: string; status: string; aware_at: string; deadlines: ClockDeadline[] } | null };

async function load(me: CurrentUser) {
  const db = await createClient();
  const lead = me.role !== "staff";
  const names = me.role === "manager" ? db.from("profiles").select("id, full_name") : Promise.resolve({ data: [] });
  const [deadlines, incidents, sets, fields, tasks, approvals, people, invites, alerts, audit] = await Promise.all([
    lead
      ? db.from("deadlines").select("due_at, incidents(id, code, title, status, aware_at, deadlines(type, due_at, status, provisional, met_at))").eq("type", "commissioner_72h").eq("status", "open").order("due_at").limit(1)
      : Promise.resolve({ data: [] }),
    // Step dates and figures for the progress card come along in the same request.
    db.from("incidents").select("id, code, title, status, reported_by, reported_at, individuals_affected, assessments(assessed_at), notifications(sent_at), incident_data_sets(count)").neq("status", "closed").order("reported_at", { ascending: false }).limit(10),
    lead ? db.from("data_sets").select("id", { count: "exact", head: true }).eq("status", "active") : Promise.resolve({ count: 0 }),
    lead ? db.from("data_fields").select("is_sensitive") : Promise.resolve({ data: [] }),
    db.from("tasks").select("id, title, due_at, completed_at, assignee_id, incidents(code)").is("completed_at", null).order("due_at", { ascending: true, nullsFirst: false }).limit(5),
    me.role === "manager" ? db.from("notifications").select("created_at", { count: "exact" }).eq("status", "pending_approval").order("created_at").limit(1) : Promise.resolve({ count: 0, data: [] }),
    me.role === "manager" ? db.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true) : Promise.resolve({ count: 0 }),
    me.role === "manager" ? db.from("invitations").select("id", { count: "exact", head: true }).is("accepted_at", null).is("revoked_at", null) : Promise.resolve({ count: 0 }),
    db.from("alerts").select("id, message, level, created_at").is("read_at", null).order("created_at", { ascending: false }).limit(5),
    me.role === "manager" ? db.from("audit_log").select("id, table_name, action, created_at, actor_id").order("created_at", { ascending: false }).limit(6) : Promise.resolve({ data: [] }),
  ]);
  // A failed request would otherwise just look like "nothing here", so log it.
  for (const [name, r] of Object.entries({ deadlines, incidents, sets, fields, tasks, approvals, people, invites, alerts, audit })) {
    const err = (r as { error?: { message: string } | null }).error;
    if (err) console.error(`[home] ${name} query failed: ${err.message}`);
  }
  const people_ = ((await names).data ?? []) as { id: string; full_name: string }[];
  const fieldRows = (fields.data ?? []) as { is_sensitive: boolean }[];
  return {
    deadline: ((deadlines.data ?? []) as unknown as Deadline[])[0] ?? null,
    incidents: ((incidents.data ?? []) as unknown as RawIncident[]).map((i) => ({
      id: i.id, code: i.code, title: i.title, status: i.status, reported_by: i.reported_by,
      reportedAt: i.reported_at,
      assessedAt: earliest(i.assessments?.map((a) => a.assessed_at)),
      notifiedAt: earliest(i.notifications?.map((n) => n.sent_at)),
      people: i.individuals_affected,
      places: i.incident_data_sets?.[0]?.count ?? 0,
    })),
    sets: sets.count ?? 0,
    fieldTotal: fieldRows.length,
    fieldSensitive: fieldRows.filter((f) => f.is_sensitive).length,
    tasks: (tasks.data ?? []) as unknown as { id: string; title: string; due_at: string | null; assignee_id: string | null; incidents: { code: string } | null }[],
    approvals: approvals.count ?? 0,
    oldestDraft: ((approvals as { data?: { created_at: string }[] }).data ?? [])[0]?.created_at ?? null,
    people: people.count ?? 0,
    invites: invites.count ?? 0,
    alerts: (alerts.data ?? []) as { id: string; message: string; level: string; created_at: string }[],
    audit: ((audit.data ?? []) as { id: number; table_name: string; action: string; created_at: string; actor_id: string | null }[]).map((a) => ({
      ...a,
      actor: a.actor_id ? (firstName(people_.find((p) => p.id === a.actor_id)?.full_name) || "Someone") : "System",
    })),
  };
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ panel?: string }> }) {
  const me = await requirePage("/home");
  const { panel } = await searchParams;
  return <HomeView me={me} d={await load(me)} panel={panel} />;
}

export type HomeData = Awaited<ReturnType<typeof load>>;
