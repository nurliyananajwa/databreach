import { requirePage } from "@/lib/auth";
import PageHeader from "@/components/app/PageHeader";
import ComingSoon from "@/components/app/ComingSoon";

export const metadata = { title: "Data inventory | PDPA Breach Response Tracker" };

export default async function Page() {
  await requirePage("/inventory");
  return (
    <>
      <PageHeader title="Data inventory" intro="The personal data your business holds, where it is kept and who can open it." />
      <ComingSoon sprint={2} what="List, add and edit data sets and their fields. Every save keeps a new version." />
    </>
  );
}
