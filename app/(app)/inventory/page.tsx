import Link from "next/link";
import { requirePage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/app/PageHeader";
import type { Tab } from "@/components/app/PageTabs";
import { Card, Empty, Meter } from "@/components/app/hub/ui";
import CountUp from "@/components/app/hub/CountUp";
import Icon from "@/components/app/hub/icons";
import { firstName } from "@/lib/names";
import InventoryList, { type Row } from "./InventoryList";

export const metadata = { title: "Data inventory | PDPA Breach Response Tracker" };

type DbRow = {
  id: string; code: string; name: string; storage_location: string; status: "active" | "archived";
  approx_records: number | null;
  owner: { full_name: string; is_active: boolean } | null;
  data_fields: { is_sensitive: boolean }[];
};
type Version = { version_no: number; changed_at: string; changed_by: string | null; data_sets: { id: string; code: string; name: string } | null };

const VIEWS = ["all", "sensitive", "no-owner", "archived"] as const;
type View = (typeof VIEWS)[number];
const kl = new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kuala_Lumpur" });

export default async function Page({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  // The queries start together with the sign-in check (fewer trips to Supabase).
  // RLS still decides what each one returns.
  const db = await createClient();
  const [me, sp, { data, error }, { data: recent }, { data: people }] = await Promise.all([
    requirePage("/inventory"),
    searchParams,
    db.from("data_sets")
      .select("id, code, name, storage_location, status, approx_records, owner:profiles!data_sets_owner_id_fkey(full_name, is_active), data_fields(is_sensitive)")
      .order("code"),
    db.from("data_set_versions").select("version_no, changed_at, changed_by, data_sets(id, code, name)").order("changed_at", { ascending: false }).limit(5),
    db.from("profiles").select("id, full_name"),
  ]);
  const view: View = VIEWS.includes(sp.view as View) ? (sp.view as View) : "all";
  const lead = me.role === "dp_lead";

  const rows: Row[] = ((data ?? []) as unknown as DbRow[]).map((d) => ({
    id: d.id, code: d.code, name: d.name, storage: d.storage_location,
    archived: d.status === "archived", records: d.approx_records,
    owner: d.owner?.is_active ? d.owner.full_name : null,
    fields: d.data_fields.length,
    sensitiveFields: d.data_fields.filter((f) => f.is_sensitive).length,
  }));
  const active = rows.filter((r) => !r.archived);
  const n = {
    active: active.length,
    archived: rows.length - active.length,
    fields: active.reduce((a, r) => a + r.fields, 0),
    sensFields: active.reduce((a, r) => a + r.sensitiveFields, 0),
    sensitive: active.filter((r) => r.sensitiveFields > 0).length,
    noOwner: active.filter((r) => !r.owner).length,
  };
  const shown = {
    all: active,
    sensitive: active.filter((r) => r.sensitiveFields > 0),
    "no-owner": active.filter((r) => !r.owner),
    archived: rows.filter((r) => r.archived),
  }[view];

  // Folder tabs: views INSIDE the inventory (the top menu is for going elsewhere).
  const tab = (v: View, title: string, sub: string, icon: Tab["icon"], warn = false): Tab =>
    ({ href: v === "all" ? "/inventory" : `/inventory?view=${v}`, icon, title, sub, current: view === v, warn });
  const tabs: Tab[] = [
    tab("all", "All data sets", `${n.active} active`, "db"),
    tab("sensitive", "Sensitive", `${n.sensitive} set${n.sensitive === 1 ? "" : "s"}`, "lock"),
    tab("no-owner", "No owner", n.noOwner ? `${n.noOwner} need${n.noOwner === 1 ? "s" : ""} one` : "All owned", "person", n.noOwner > 0),
    tab("archived", "Archived", String(n.archived), "inbox"),
  ];

  const who = new Map((people ?? []).map((p) => [p.id as string, firstName(p.full_name as string)]));
  const changes = (recent ?? []) as unknown as Version[];
  const LIST_TITLE: Record<View, [string, string]> = {
    all: ["All data sets", "In use, not archived"],
    sensitive: ["Sensitive data sets", "Have at least one sensitive field"],
    "no-owner": ["Data sets without an owner", "Choose someone to keep each one safe"],
    archived: ["Archived data sets", "Kept for the record, not offered for new reports"],
  };

  return (
    <>
      <PageHeader
       
        tabs={tabs}
        title="Data inventory"
        intro={lead
          ? "Every set of personal data your business holds: where it is kept, why, and who looks after it. Field names only, never the data itself."
          : "Every set of personal data your business holds. The Compliance Officer keeps this list up to date; you can view it."}
      />
      <main id="main" className="hub-main">
        {error ? (
          <p role="alert" className="hub-card">The inventory could not be loaded. Please refresh the page.</p>
        ) : (
          <div className="hub-grid">
            <Card icon="db" title="Data sets" sub="In use, not archived" delay={0.05}>
              <p className="hub-big"><CountUp value={n.active} /><small>active</small></p>
              <div className="hub-legend"><span>Fields: {n.fields}</span><span>Archived: {n.archived}</span></div>
              <Meter value={n.active} max={rows.length} label={`${n.active} of ${rows.length} data sets are active`} />
            </Card>
            <Card icon="lock" title="Sensitive" sub="Health, religion, criminal records" delay={0.1}>
              <p className="hub-big"><CountUp value={n.sensitive} /><small>of {n.active} sets</small></p>
              <div className="hub-legend"><span>Sensitive fields: {n.sensFields}</span><span>All fields: {n.fields}</span></div>
              <Meter value={n.sensFields} max={n.fields} label={`${n.sensFields} of ${n.fields} fields are sensitive`} />
            </Card>
            <Card icon="person" title="Owners" sub="Who keeps each one safe" delay={0.15}>
              <p className="hub-big"><CountUp value={n.active - n.noOwner} /><small>of {n.active} owned</small></p>
              <div className="hub-legend"><span className={n.noOwner ? "warn" : undefined}>{n.noOwner} without an owner</span><span>Owned: {n.active - n.noOwner}</span></div>
              <Meter value={n.active - n.noOwner} max={n.active} label={`${n.active - n.noOwner} of ${n.active} data sets have an owner`} />
            </Card>

            <section className="hub-card inv-side-card" style={{ animationDelay: ".2s" }} aria-labelledby="recent-h">
              <div className="hub-ch"><div>
                <h2 id="recent-h"><Icon name="clock" />Recently changed</h2>
                <p className="sub">Every save is kept as a new version</p>
              </div></div>
              <div className="hub-ledger">
                {changes.length ? changes.map((c) => c.data_sets && (
                  <Link key={`${c.data_sets.id}-${c.version_no}`} href={`/inventory/${c.data_sets.id}`} className="hub-row inv-row-link">
                    <time>{kl.format(new Date(c.changed_at))}</time>
                    <p><b>{c.data_sets.code}</b> {c.data_sets.name}, version {c.version_no}{c.changed_by ? ` by ${who.get(c.changed_by) ?? "a former user"}` : ""}</p>
                  </Link>
                )) : <Empty icon="clock" title="No changes yet" body="Each save of a data set shows here." />}
              </div>
              {lead && <Link href="/inventory/new" className="hub-btn inv-new">New data set</Link>}
            </section>

            {rows.length === 0 ? (
              <section className="hub-card inv-wide inv-empty" aria-labelledby="inv-empty-h">
                <div>
                  <div className="hub-ch"><div><h2 id="inv-empty-h"><Icon name="db" />Start your inventory</h2></div></div>
                  <p>{lead
                    ? "List the places personal data is kept every day. When a breach happens, it is reported against this list."
                    : "Nothing is listed yet. The Compliance Officer adds the places personal data is kept; they will show here."}</p>
                  {lead && <Link href="/inventory/new" className="hub-btn">Add the first data set</Link>}
                </div>
                <ul className="inv-examples" aria-label="Examples">
                  <li><b>Payroll system</b><span>Salary, bank account number</span></li>
                  <li><b>Staff records</b><span>IC number, home address</span></li>
                  <li><b>Client list</b><span>Contact person, phone number</span></li>
                </ul>
              </section>
            ) : (
              <InventoryList rows={shown} title={LIST_TITLE[view][0]} sub={LIST_TITLE[view][1]} />
            )}
          </div>
        )}
      </main>
    </>
  );
}
