import { requirePage, titleFor } from "@/lib/auth";
import PageHeader from "@/components/app/PageHeader";
import ComingSoon from "@/components/app/ComingSoon";

export const generateMetadata = titleFor("/my-reports", "My reports");

export default async function Page() {
  await requirePage("/my-reports");
  return (
    <>
      <PageHeader title="My reports" intro="The breaches you reported and their current stage." />
      <ComingSoon sprint={3} what="Each report you made, with its status. You see only your own reports." />
    </>
  );
}
