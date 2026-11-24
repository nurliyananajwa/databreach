import { requirePage } from "@/lib/auth";
import PageHeader from "@/components/app/PageHeader";
import ComingSoon from "@/components/app/ComingSoon";

export const metadata = { title: "Report a breach | PDPA Breach Response Tracker" };

export default async function Page() {
  await requirePage("/report");
  return (
    <>
      <PageHeader here="/report" title="Report a breach" intro="Tell your data protection lead what happened. It takes about two minutes." />
      <ComingSoon sprint={3} what="A short form: what happened, when you found out, and which records may be involved." />
    </>
  );
}
