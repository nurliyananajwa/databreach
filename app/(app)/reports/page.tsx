import { requirePage } from "@/lib/auth";
import PageHeader from "@/components/app/PageHeader";

export const metadata = { title: "Reports | PDPA Breach Response Tracker" };

const PLANNED: [string, string][] = [
  ["Filter", "By incident type (lost or stolen, sent to the wrong person, someone got in, something else), by status, and by date range."],
  ["Summary", "Incidents by type and by status, and how many Commissioner notices were sent within 72 hours."],
  ["Table", "Every matching incident with its code, type, status, people affected and key dates."],
  ["Download", "As a PDF to print or attach, or as a CSV to open in Excel."],
];

export default async function Page() {
  await requirePage("/reports");
  return (
    <>
      <PageHeader title="Reports" intro="Generate a report of your incidents by type and status, then download it." />
      <main id="main" className="hub-main">
        <div className="hub-card" style={{ maxWidth: 760 }}>
          <span className="hub-tag">Coming in Sprint 5</span>
          <p style={{ marginTop: 12, fontSize: 18, fontWeight: 500, letterSpacing: "-.02em" }}>What this page will do</p>
          <div className="hub-rows" style={{ marginTop: 12 }}>
            {PLANNED.map(([t, d]) => (
              <div key={t} style={{ gridTemplateColumns: "120px 1fr" }}>
                <b>{t}</b>
                <span className="muted" style={{ fontSize: 14 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
