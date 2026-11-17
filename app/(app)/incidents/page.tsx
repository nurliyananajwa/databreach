import { requirePage } from "@/lib/auth";
import PageHeader from "@/components/app/PageHeader";
import ComingSoon from "@/components/app/ComingSoon";

export const metadata = { title: "Incidents | PDPA Breach Response Tracker" };

export default async function Page() {
  await requirePage("/incidents");
  return (
    <>
      <PageHeader title="Incidents" intro="Every reported breach and where it is in the response." />
      <ComingSoon sprint={3} what="Incident list and the incident page: confirm exposed fields, run the assessment, record the decision, follow the deadlines." />
    </>
  );
}
