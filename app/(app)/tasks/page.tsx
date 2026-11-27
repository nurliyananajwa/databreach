import { requirePage } from "@/lib/auth";
import PageHeader from "@/components/app/PageHeader";
import ComingSoon from "@/components/app/ComingSoon";

export const metadata = { title: "Tasks | Breachfolio" };

export default async function Page() {
  await requirePage("/tasks");
  return (
    <>
      <PageHeader title="Tasks" intro="Follow-up work for each breach." />
      <ComingSoon sprint={4} what="Tasks with an owner and due date. Staff see only tasks given to them." />
    </>
  );
}
