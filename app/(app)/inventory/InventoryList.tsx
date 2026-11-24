"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/app/hub/icons";

export type Row = {
  id: string; code: string; name: string; storage: string; archived: boolean;
  records: number | null; owner: string | null; fields: number; sensitiveFields: number;
};

const num = new Intl.NumberFormat("en-MY");

// The list for the folder tab that is open (All, Sensitive, No owner, Archived).
// Which rows come in is decided by the tab; the search only narrows them.
export default function InventoryList({ rows, title, sub }: { rows: Row[]; title: string; sub: string }) {
  const [q, setQ] = useState("");
  const t = q.trim().toLowerCase();
  const shown = t ? rows.filter((r) => `${r.code} ${r.name} ${r.storage} ${r.owner ?? ""}`.toLowerCase().includes(t)) : rows;

  return (
    <section className="hub-card inv-wide inv-list" aria-labelledby="inv-h" style={{ animationDelay: ".25s" }}>
      <div className="hub-ch">
        <div>
          <h2 id="inv-h"><Icon name="list" />{title} <span className="inv-count">{rows.length}</span></h2>
          <p className="sub">{sub}</p>
        </div>
        <label className="inv-search">
          <Icon name="search" />
          <span className="sr-only">Search data sets</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, place or owner" />
        </label>
      </div>

      {shown.length === 0 ? (
        <p className="inv-none">
          {rows.length === 0 ? "Nothing here." : "No data sets match the search."}{" "}
          {q && <button type="button" onClick={() => setQ("")}>Clear the search</button>}
        </p>
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
                      {r.sensitiveFields > 0 && <span className="inv-flag sens">{r.sensitiveFields} sensitive</span>}
                      {r.archived && <span className="inv-flag">Archived</span>}
                    </span>
                  </th>
                  <td>{r.storage}</td>
                  <td>{r.owner ?? <span className="inv-flag warn">No owner</span>}</td>
                  <td className="num">{r.fields}</td>
                  <td className="num">{r.records === null ? "–" : num.format(r.records)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
