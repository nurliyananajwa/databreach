"use client";

import { useState } from "react";

// A preview of the tracker's data inventory: where a typical small business
// keeps personal data. Field names only, never the data itself.
type Cat = "id" | "money" | "health" | "other";
const CAT_OF: Record<string, Cat> = {
  "IC number": "id",
  "Bank account": "money",
  Salary: "money",
  "Past salary": "money",
  "Card details": "money",
  "Medical certificate": "health",
  Illness: "health",
  "Reason for visit": "health",
};
const cat = (f: string): Cat => CAT_OF[f] ?? "other";

const PLACES = [
  { place: "Customer list", where: "Google Sheet", fields: ["Name", "Phone", "Email", "Address"] },
  { place: "Online orders", where: "Online store", fields: ["Name", "Address", "Phone", "Card details"] },
  { place: "Staff payroll", where: "Accounting laptop", fields: ["Name", "IC number", "Bank account", "Salary"] },
  { place: "Job applications", where: "Email inbox", fields: ["Resume", "IC number", "Date of birth", "Past salary"] },
  { place: "Medical leave", where: "HR folder", fields: ["Name", "Medical certificate", "Illness"] },
  { place: "Visitor logbook", where: "Front desk", fields: ["Name", "IC number", "Phone"] },
  { place: "Appointment list", where: "Booking app", fields: ["Name", "Phone", "Reason for visit"] },
  { place: "CCTV footage", where: "Shop recorder", fields: ["Faces", "Car plates", "Time of visit"] },
  { place: "WhatsApp groups", where: "Staff phones", fields: ["Names", "Phone numbers", "Photos"] },
  { place: "Supplier invoices", where: "Accounts folder", fields: ["Contact name", "Bank account", "Phone"] },
];

const FILTERS: { id: Cat | "all"; label: string; noun: string }[] = [
  { id: "all", label: "All", noun: "personal data" },
  { id: "id", label: "ID numbers", noun: "ID numbers" },
  { id: "money", label: "Money", noun: "bank, card or salary data" },
  { id: "health", label: "Health", noun: "health data" },
];

export default function Inventory() {
  const [filter, setFilter] = useState<Cat | "all">("all");
  const match = (fields: string[]) => filter === "all" || fields.some((f) => cat(f) === filter);
  const count = PLACES.filter((p) => match(p.fields)).length;
  const noun = FILTERS.find((f) => f.id === filter)!.noun;

  return (
    <div className="overflow-hidden rounded-xl border border-rule bg-white shadow-[0_30px_60px_-40px_rgba(23,33,58,0.45)]" aria-label="Data inventory preview">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-rule bg-paper px-5 py-3">
        <p className="font-bold">Data inventory</p>
        <p className="text-sm text-muted">{PLACES.length} places</p>
        <div className="ml-auto flex flex-wrap gap-1.5" role="group" aria-label="Show places holding">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                filter === f.id ? "border-ink bg-ink text-white" : "border-rule bg-white hover:border-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <table className="w-full text-left">
        <thead className="sr-only sm:not-sr-only">
          <tr className="text-sm text-muted">
            <th scope="col" className="px-5 pb-1 pt-3 font-normal">Place</th>
            <th scope="col" className="px-3 pb-1 pt-3 font-normal">Kept in</th>
            <th scope="col" className="pb-1 pl-3 pr-5 pt-3 font-normal">Personal data inside</th>
          </tr>
        </thead>
        <tbody>
          {PLACES.map((p) => {
            const on = match(p.fields);
            return (
              <tr key={p.place} className={`border-t border-rule transition-opacity duration-300 first:border-t-0 sm:first:border-t ${on ? "" : "opacity-30"}`}>
                <th scope="row" className="block px-5 pt-3 font-bold sm:table-cell sm:whitespace-nowrap sm:py-2.5 sm:pr-3">
                  {p.place}
                  <span className="block text-sm font-normal text-muted sm:hidden">{p.where}</span>
                </th>
                <td className="hidden whitespace-nowrap px-3 py-2.5 text-[0.95rem] text-muted sm:table-cell">{p.where}</td>
                <td className="block px-5 pb-3 pt-2 sm:table-cell sm:py-2.5 sm:pl-3">
                  <ul className="flex flex-wrap gap-1.5">
                    {p.fields.map((f) => {
                      const hot = filter !== "all" && cat(f) === filter;
                      const sensitive = cat(f) !== "other";
                      return (
                        <li
                          key={f}
                          className={`rounded border px-2 py-0.5 text-sm transition-colors ${
                            hot ? "border-stamp bg-stamp text-white" : sensitive ? "border-stamp/40 text-stamp" : "border-rule"
                          }`}
                        >
                          {f}
                        </li>
                      );
                    })}
                  </ul>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="border-t border-rule bg-paper px-5 py-3 text-[0.95rem]" aria-live="polite">
        <span className="font-bold">
          {count} of {PLACES.length} places
        </span>{" "}
        hold {noun}. If one of them leaks, the tracker already knows what was inside.
      </p>
    </div>
  );
}
