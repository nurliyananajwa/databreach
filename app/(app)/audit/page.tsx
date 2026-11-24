import { requirePage } from "@/lib/auth";
import PageHeader from "@/components/app/PageHeader";
import ComingSoon from "@/components/app/ComingSoon";

export const metadata = { title: "Audit log | PDPA Breach Response Tracker" };

export default async function Page() {
  await requirePage("/audit");
  return (
    <>
      <PageHeader title="Audit log" intro="Who changed what, and when." />
      <ComingSoon sprint={5} what="Every change in the system, newest first, with filters by user and record." />
    </>
  );
}
