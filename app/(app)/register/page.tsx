import { requirePage, titleFor } from "@/lib/auth";
import PageHeader from "@/components/app/PageHeader";
import ComingSoon from "@/components/app/ComingSoon";

export const generateMetadata = titleFor("/register", "Breach register");

export default async function Page() {
  await requirePage("/register");
  return (
    <>
      <PageHeader title="Breach register" intro="Every breach, including those not notified, kept for at least two years." />
      <ComingSoon sprint={4} what="The full register with filters and export, protected from deletion until its keep-until date." />
    </>
  );
}
