import { requirePage } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";
import PageHeader from "@/components/app/PageHeader";
import SettingsView from "./SettingsView";

export const metadata = { title: "Settings | PDPA Breach Response Tracker" };

export default async function Page() {
  const me = await requirePage("/settings");
  return (
    <>
      <PageHeader title="Settings" intro="Your own details. Every change is written to the activity log." />
      <SettingsView name={me.fullName} email={me.email} role={ROLE_LABEL[me.role]} org={me.orgName} />
    </>
  );
}
