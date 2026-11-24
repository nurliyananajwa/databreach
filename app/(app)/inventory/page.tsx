import Link from "next/link";
import { requirePage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/app/PageHeader";
import { Card } from "@/components/app/hub/ui";
import CountUp from "@/components/app/hub/CountUp";
import InventoryList, { type Row } from "./InventoryList";

export const metadata = { title: "Data inventory | PDPA Breach Response Tracker" };

type DbRow = {
  id: string; code: string; name: string; storage_location: string; status: "active" | "archived";
  approx_records: number | null; updated_at: string;
  owner: { full_name: string; is_active: boolean } | null;
  data_fields: { is_sensitive: boolean }[];
};

export default async function Page() {
  const me = await requirePage("/inventory");
  const db = await createClient();
  const { data, error } = await db
    .from("data_sets")
    .select("id, code, name, storage_location, status, approx_records, updated_at, owner:profiles!data_sets_owner_id_fkey(full_name, is_active), data_fields(is_sensitive)")
    .order("code");

  const rows: Row[] = ((data ?? []) as unknown as DbRow[]).map((d) => ({
    id: d.id,
    code: d.code,
    name: d.name,
    storage: d.storage_location,
    archived: d.status === "archived",
    records: d.approx_records,
    owner: d.owner?.is_active ? d.owner.full_name : null,
    fields: d.data_fields.length,
    sensitive: d.data_fields.some((f) => f.is_sensitive),
  }));
  const lead = me.role === "dp_lead";
  const active = rows.filter((r) => !r.archived);
  const stats = {
    sets: active.length,
    sensitive: active.filter((r) => r.sensitive).length,
    noOwner: active.filter((r) => !r.owner).length,
  };

  return (
    <>
      <PageHeader
        here="/inventory"
        hereSub={`${stats.sets} data set${stats.sets === 1 ? "" : "s"}`}
        title="Data inventory"
        intro={lead
          ? "Every set of personal data your business holds: where it is kept, why, and who looks after it. Field names only, never the data itself."
          : "Every set of personal data your business holds. The Compliance Officer keeps this list up to date; you can view it."}
        action={lead && rows.length > 0 ? { href: "/inventory/new", label: "New data set" } : undefined}
      />
      <main id="main" className="hub-main">
        {error ? (
          <p role="alert" className="hub-card">The inventory could not be loaded. Please refresh the page.</p>
        ) : (
          <>
            <div className="inv-stats">
              <Card icon="db" title="Data sets" sub="In use, not archived" delay={0.05}>
                <p className="hub-big"><CountUp value={stats.sets} /><small>active</small></p>
              </Card>
              <Card icon="lock" title="With sensitive fields" sub="Health, religion, criminal records" delay={0.1}>
                <p className="hub-big"><CountUp value={stats.sensitive} /><small>of {stats.sets}</small></p>
              </Card>
              <Card icon="person" title="Without an owner" sub="Nobody responsible for it yet" delay={0.15}>
                <p className="hub-big"><CountUp value={stats.noOwner} /><small>{stats.noOwner ? "need an owner" : "all owned"}</small></p>
              </Card>
            </div>
            {rows.length === 0 ? (
              <section className="hub-card inv-empty" aria-labelledby="inv-empty-h">
                <div>
                  <h2 id="inv-empty-h">Start your inventory</h2>
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
              <InventoryList rows={rows} />
            )}
          </>
        )}
      </main>
    </>
  );
}
