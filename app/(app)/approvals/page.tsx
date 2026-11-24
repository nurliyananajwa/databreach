import { requirePage, titleFor } from "@/lib/auth";
import PageHeader from "@/components/app/PageHeader";
import ComingSoon from "@/components/app/ComingSoon";

export const generateMetadata = titleFor("/approvals", "Approvals");

export default async function Page() {
  await requirePage("/approvals");
  return (
    <>
      <PageHeader title="Approvals" intro="Notification drafts waiting for your approval." />
      <ComingSoon sprint={4} what="Review a draft, then approve it or return it with a note. You cannot approve a draft you wrote." />
    </>
  );
}
