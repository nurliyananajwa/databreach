import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY, type Category, type FieldInput } from "@/lib/inventory";
import PageHeader from "@/components/app/PageHeader";
import type { Tab } from "@/components/app/PageTabs";
import Icon from "@/components/app/hub/icons";
import DataSetEditor from "../DataSetEditor";
import ArchiveForm from "./ArchiveForm";
import { activePeople } from "../people";

export const metadata = { title: "Data set | PDPA Breach Response Tracker" };

const kl = new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kuala_Lumpur" });
const num = new Intl.NumberFormat("en-MY");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Snapshot = {
  name: string; storage_location: string; access_description: string | null; purpose: string;
  retention_period: string | null; owner_id: string | null; processor_name: string | null; approx_records: number | null;
  status: string; fields: { field_name: string; category: Category; is_sensitive: boolean }[];
};

export default async function Page({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ v?: string; saved?: string; tab?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID.test(id)) notFound();

  // Everything is fetched together with the sign-in check (one trip, not three).
  const db = await createClient();
  const [me, people, { data: set }, { data: fields }, { data: versions }, { data: names }] = await Promise.all([
    requirePage("/inventory"),
    activePeople(),
    db.from("data_sets").select("id, code, name, storage_location, access_description, purpose, retention_period, owner_id, processor_name, approx_records, status, version_no, updated_at").eq("id", id).maybeSingle(),
    db.from("data_fields").select("id, field_name, category, is_sensitive").eq("data_set_id", id).order("field_name"),
    db.from("data_set_versions").select("version_no, changed_at, changed_by, snapshot").eq("data_set_id", id).order("version_no", { ascending: false }),
    db.from("profiles").select("id, full_name"),
  ]);
  if (!set) notFound(); // also what RLS gives another organisation

  const who = new Map((names ?? []).map((p) => [p.id as string, p.full_name as string]));
  const lead = me.role === "dp_lead";
  const archived = set.status === "archived";
  const asked = sp.v ? Number(sp.v) : null;
  const old = asked && asked !== set.version_no ? versions?.find((v) => v.version_no === asked) : undefined;
  if (asked && asked !== set.version_no && !old) notFound();

  // What to show: an old version (read-only), the editor (Compliance Officer), or a read-only view (Manager).
  const snap: Snapshot = old
    ? (old.snapshot as Snapshot)
    : { ...set, fields: (fields ?? []) as Snapshot["fields"] };

  const showHistory = sp.tab === "history" || Boolean(old);
  const count = versions?.length ?? 0;
  // Folder tabs: what is inside this data set.
  const tabs: Tab[] = [
    { href: `/inventory/${id}`, icon: "db", title: set.code, sub: archived ? "Archived" : `Version ${set.version_no}`, current: !showHistory },
    { href: `/inventory/${id}?tab=history`, icon: "clock", title: "History", sub: `${count} version${count === 1 ? "" : "s"}`, current: showHistory },
  ];

  return (
    <>
      <PageHeader
        tabs={tabs}
        eyebrow={`Data inventory · ${set.code}`}
        title={set.name}
        intro={old
          ? `You are looking at version ${old.version_no}, saved ${kl.format(new Date(old.changed_at))}. It cannot be changed.`
          : set.purpose}
      />
      <main id="main" className="hub-main">
        <Link href={old ? `/inventory/${id}?tab=history` : "/inventory"} className="hub-back">← {old ? "Back to the history" : "Back to the inventory"}</Link>
        {sp.saved === "new" && !old && <p role="status" className="hub-msg-ok inv-banner"><Icon name="check" className="size-4" />Data set created as version 1.</p>}
        {archived && !old && <p className="inv-banner inv-archived"><Icon name="lock" className="size-4" />Archived. Restore it to make changes.</p>}

        {showHistory && !old ? (
          <section className="hub-card inv-history-card" aria-labelledby="hist-h">
            <h2 id="hist-h" className="inv-h"><Icon name="clock" />Version history</h2>
            <p className="inv-sub">Every save is kept and can never be edited. Open a version to see the data set as it was.</p>
            <ol className="inv-history">
              {(versions ?? []).map((v) => {
                const current = v.version_no === set.version_no;
                return (
                  <li key={v.version_no}>
                    <Link href={current ? `/inventory/${id}` : `/inventory/${id}?v=${v.version_no}`}>
                      <b>Version {v.version_no}{current ? " (current)" : ""}</b>
                      <span>{v.changed_by ? who.get(v.changed_by) ?? "A former user" : "System"} · {kl.format(new Date(v.changed_at))}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : (
          <div className="inv-detail">
            <div className="inv-main">
              {lead && !old && !archived ? (
                <DataSetEditor
                  people={people}
                  values={{
                    id: set.id, version: set.version_no, name: set.name, storage_location: set.storage_location, access: set.access_description ?? "",
                    purpose: set.purpose, retention: set.retention_period ?? "", owner: set.owner_id ?? "",
                    processor: set.processor_name ?? "", records: set.approx_records?.toString() ?? "",
                    fields: (fields ?? []).map((f): FieldInput => ({ id: f.id, name: f.field_name, category: f.category as Category, sensitive: f.is_sensitive })),
                  }}
                />
              ) : (
                <ReadOnly snap={snap} owner={snap.owner_id ? who.get(snap.owner_id) ?? "A former user" : null} />
              )}
            </div>
            <aside className="inv-side">
              <section className="hub-card" aria-labelledby="about-h">
                <h2 id="about-h" className="inv-h"><Icon name="shield" />About this data set</h2>
                <dl className="inv-about">
                  <div><dt>Code</dt><dd>{set.code}</dd></div>
                  <div><dt>Status</dt><dd>{archived ? "Archived" : "Active"}</dd></div>
                  <div><dt>Version</dt><dd>{old ? `${old.version_no} of ${set.version_no}` : set.version_no}</dd></div>
                  <div><dt>Last changed</dt><dd>{kl.format(new Date(set.updated_at))}</dd></div>
                </dl>
                <Link href={`/inventory/${id}?tab=history`} className="hub-back">See all {count} version{count === 1 ? "" : "s"}</Link>
              </section>
              {lead && !old && (
                <section className="hub-card"><ArchiveForm id={set.id} archived={archived} /></section>
              )}
            </aside>
          </div>
        )}
      </main>
    </>
  );
}

function ReadOnly({ snap, owner }: { snap: Snapshot; owner: string | null }) {
  const rows: [string, string | null][] = [
    ["Where it is kept", snap.storage_location],
    ["Owner", owner],
    ["Approximate number of records", snap.approx_records === null ? null : num.format(snap.approx_records)],
    ["Purpose", snap.purpose],
    ["Who can access it", snap.access_description],
    ["Retention period", snap.retention_period],
    ["Processor", snap.processor_name],
  ];
  return (
    <>
      <section className="hub-card" aria-labelledby="ro-details">
        <h2 id="ro-details" className="inv-h"><Icon name="db" />Details</h2>
        <dl className="inv-dl">
          {rows.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v ?? <span className={k === "Owner" ? "inv-flag warn" : "inv-muted"}>{k === "Owner" ? "No owner" : "Not recorded"}</span>}</dd></div>
          ))}
        </dl>
      </section>
      <section className="hub-card" aria-labelledby="ro-fields">
        <h2 id="ro-fields" className="inv-h"><Icon name="list" />Personal data fields ({snap.fields.length})</h2>
        {snap.fields.length === 0 ? <p className="inv-sub">No fields listed.</p> : (
          <ul className="inv-ro-fields">
            {snap.fields.map((f) => (
              <li key={f.field_name}>
                <b>{f.field_name}</b>
                <span>{CATEGORY[f.category]?.label ?? f.category}</span>
                {f.is_sensitive && <span className="inv-flag sens">Sensitive</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
