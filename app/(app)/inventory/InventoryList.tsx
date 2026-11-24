"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Icon from "@/components/app/hub/icons";

export type Row = {
  id: string; code: string; name: string; storage: string; archived: boolean;
  records: number | null; owner: string | null; fields: number; sensitive: boolean;
};

const FILTERS = [
  { key: "active", label: "Active" },
  { key: "sensitive", label: "Sensitive" },
  { key: "no-owner", label: "No owner" },
  { key: "archived", label: "Archived" },
  { key: "all", label: "All" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

const n = new Intl.NumberFormat("en-MY");

export default function InventoryList({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("active");

  const counts = useMemo(() => ({
    active: rows.filter((r) => !r.archived).length,
    sensitive: rows.filter((r) => !r.archived && r.sensitive).length,
    "no-owner": rows.filter((r) => !r.archived && !r.owner).length,
    archived: rows.filter((r) => r.archived).length,
    all: rows.length,
  }), [rows]);

  const shown = rows.filter((r) => {
    if (filter === "active" && r.archived) return false;
    if (filter === "archived" && !r.archived) return false;
    if (filter === "sensitive" && (r.archived || !r.sensitive)) return false;
    if (filter === "no-owner" && (r.archived || r.owner)) return false;
    const t = q.trim().toLowerCase();
    return !t || `${r.code} ${r.name} ${r.storage} ${r.owner ?? ""}`.toLowerCase().includes(t);
  });

  return (
    <section className="hub-card inv-list" aria-labelledby="inv-h">
      <div className="inv-tools">
        <h2 id="inv-h">Data sets</h2>
        <label className="inv-search">
          <Icon name="search" />
          <span className="sr-only">Search data sets</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, place or owner" />
        </label>
      </div>
      <div className="inv-filters" role="group" aria-label="Show">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}
            className={f.key === "no-owner" && counts["no-owner"] > 0 ? "warn" : undefined}>
            {f.label} <span>{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="inv-none">No data sets match. {q && <button type="button" onClick={() => setQ("")}>Clear the search</button>}</p>
      ) : (
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th scope="col">Data set</th>
                <th scope="col">Kept in</th>
                <th scope="col">Owner</th>
                <th scope="col" className="num">Fields</th>
                <th scope="col" className="num">Records</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className={r.archived ? "archived" : undefined}>
                  <th scope="row">
                    <Link href={`/inventory/${r.id}`}>
                      <span className="code">{r.code}</span>
                      <b>{r.name}</b>
                    </Link>
                    <span className="flags">
                      {r.sensitive && <span className="inv-flag sens">Sensitive</span>}
                      {r.archived && <span className="inv-flag">Archived</span>}
                    </span>
                  </th>
                  <td>{r.storage}</td>
                  <td>{r.owner ?? <span className="inv-flag warn">No owner</span>}</td>
                  <td className="num">{r.fields}</td>
                  <td className="num">{r.records === null ? "–" : n.format(r.records)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
