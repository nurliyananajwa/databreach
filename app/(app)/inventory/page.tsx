import Link from "next/link";
import { requirePage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/app/PageHeader";
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

  return (
    <>
      <PageHeader
        title="Data inventory"
        intro={lead
          ? "Every set of personal data your business holds: where it is kept, why, and who looks after it. Field names only, never the data itself."
          : "Every set of personal data your business holds. The Compliance Officer keeps this list up to date; you can view it."}
        action={lead ? { href: "/inventory/new", label: "New data set" } : undefined}
      />
      <main id="main" className="hub-main">
        {error ? (
          <p role="alert" className="hub-card">The inventory could not be loaded. Please refresh the page.</p>
        ) : rows.length === 0 ? (
          <section className="hub-card inv-empty">
            <h2>Nothing listed yet</h2>
            <p>Start with the places personal data is kept every day, such as the payroll system, staff records or a customer list. When a breach happens, it is reported against this list.</p>
            {lead && <Link href="/inventory/new" className="hub-btn">Add the first data set</Link>}
          </section>
        ) : (
          <InventoryList rows={rows} />
        )}
      </main>
    </>
  );
}
