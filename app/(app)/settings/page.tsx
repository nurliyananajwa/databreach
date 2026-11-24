import { requirePage } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";
import PageHeader from "@/components/app/PageHeader";
import Icon from "@/components/app/hub/icons";
import ProfileForm from "./ProfileForm";

export const metadata = { title: "Settings | PDPA Breach Response Tracker" };

export default async function Page() {
  const me = await requirePage("/settings");
  return (
    <>
      <PageHeader title="Settings" intro="Your own details. Changes are written to the activity log." />
      <main id="main" className="hub-main">
        <section className="hub-card hub-settings">
          <div className="hub-ch"><div>
            <h2><Icon name="person" />Profile</h2>
            <p className="sub">How you appear to your team</p>
          </div></div>
          <ProfileForm name={me.fullName} email={me.email} role={ROLE_LABEL[me.role]} />
        </section>
      </main>
    </>
  );
}
