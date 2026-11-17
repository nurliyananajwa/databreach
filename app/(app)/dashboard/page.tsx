import { requirePage } from "@/lib/auth";
import PageHeader from "@/components/app/PageHeader";
import ComingSoon from "@/components/app/ComingSoon";

export const metadata = { title: "Dashboard | PDPA Breach Response Tracker" };

export default async function Page() {
  await requirePage("/dashboard");
  return (
    <>
      <PageHeader title="Dashboard" intro="Open incidents, deadlines and the register at a glance." />
      <ComingSoon sprint={5} what="Charts of incidents by status and month, deadlines met on time, and overdue items. Each number will be checked against a SQL count." />
    </>
  );
}
