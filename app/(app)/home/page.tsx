import { requirePage, type CurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import HomeView from "./HomeView";

export const metadata = { title: "Home | PDPA Breach Response Tracker" };

type Deadline = { due_at: string; incidents: { id: string; code: string; title: string; status: string } | null };

async function load(me: CurrentUser) {
  const db = await createClient();
  const lead = me.role !== "staff";
  const [deadlines, incidents, sets, fields, tasks, approvals, people, invites, alerts, audit] = await Promise.all([
    lead
      ? db.from("deadlines").select("due_at, incidents(id, code, title, status)").eq("type", "commissioner_72h").eq("status", "open").order("due_at").limit(1)
      : Promise.resolve({ data: [] }),
    db.from("incidents").select("id, code, title, status, reported_by").neq("status", "closed").order("reported_at", { ascending: false }).limit(10),
    lead ? db.from("data_sets").select("id", { count: "exact", head: true }).eq("status", "active") : Promise.resolve({ count: 0 }),
    lead ? db.from("data_fields").select("is_sensitive") : Promise.resolve({ data: [] }),
    db.from("tasks").select("id, title, due_at, completed_at, assignee_id, incidents(code)").is("completed_at", null).order("due_at", { ascending: true, nullsFirst: false }).limit(5),
    me.role === "manager" ? db.from("notifications").select("id", { count: "exact", head: true }).eq("status", "pending_approval") : Promise.resolve({ count: 0 }),
    me.role === "manager" ? db.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true) : Promise.resolve({ count: 0 }),
    me.role === "manager" ? db.from("invitations").select("id", { count: "exact", head: true }).is("accepted_at", null).is("revoked_at", null) : Promise.resolve({ count: 0 }),
    db.from("alerts").select("id, message, level, created_at").is("read_at", null).order("created_at", { ascending: false }).limit(5),
    me.role === "manager" ? db.from("audit_log").select("id, table_name, action, created_at").order("created_at", { ascending: false }).limit(6) : Promise.resolve({ data: [] }),
  ]);
  const fieldRows = (fields.data ?? []) as { is_sensitive: boolean }[];
  return {
    deadline: ((deadlines.data ?? []) as unknown as Deadline[])[0] ?? null,
    incidents: (incidents.data ?? []) as { id: string; code: string; title: string; status: string; reported_by: string }[],
    sets: sets.count ?? 0,
    fieldTotal: fieldRows.length,
    fieldSensitive: fieldRows.filter((f) => f.is_sensitive).length,
    tasks: (tasks.data ?? []) as unknown as { id: string; title: string; due_at: string | null; assignee_id: string | null; incidents: { code: string } | null }[],
    approvals: approvals.count ?? 0,
    people: people.count ?? 0,
    invites: invites.count ?? 0,
    alerts: (alerts.data ?? []) as { id: string; message: string; level: string; created_at: string }[],
    audit: (audit.data ?? []) as { id: number; table_name: string; action: string; created_at: string }[],
  };
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ panel?: string }> }) {
  const me = await requirePage("/home");
  const { panel } = await searchParams;
  return <HomeView me={me} d={await load(me)} panel={panel} />;
}

export type HomeData = Awaited<ReturnType<typeof load>>;
