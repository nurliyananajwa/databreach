import Link from "next/link";
import { requireRole } from "@/lib/auth";
import PageHeader from "@/components/app/PageHeader";
import DataSetEditor from "../DataSetEditor";
import { activePeople } from "../people";

export const metadata = { title: "New data set | PDPA Breach Response Tracker" };

export default async function Page() {
  await requireRole("dp_lead");
  const people = await activePeople();
  return (
    <>
      <PageHeader here="/inventory" eyebrow="Data inventory" title="New data set" intro="Describe one place where personal data is kept, then list its fields. You can change everything later." />
      <main id="main" className="hub-main">
        <Link href="/inventory" className="hub-back">← Back to the inventory</Link>
        <DataSetEditor people={people} values={{ name: "", storage_location: "", access: "", purpose: "", retention: "", owner: "", processor: "", records: "", fields: [] }} />
      </main>
    </>
  );
}
