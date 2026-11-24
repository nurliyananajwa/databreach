import Icon from "@/components/app/hub/icons";
import ProfileForm from "./ProfileForm";

// Left: who you are at a glance. Right: the details, one row each.
export default function SettingsView({ name, email, role, org }: { name: string; email: string; role: string; org: string }) {
  return (
    <main id="main" className="hub-main">
      <div className="hub-set">
        <aside className="hub-card hub-id">
          <span className="hub-id-av" aria-hidden="true">{name.charAt(0)}</span>
          <p className="name">{name}</p>
          <div className="chips"><span>{role}</span><span>{org}</span></div>
          <p className="note"><Icon name="lock" className="size-3" />Your account was set up by your organisation. Only your name can be changed here.</p>
        </aside>
        <section className="hub-card">
          <div className="hub-ch"><div>
            <h2><Icon name="person" />Profile</h2>
            <p className="sub">How you appear to your team</p>
          </div></div>
          <ProfileForm name={name} email={email} role={role} />
        </section>
      </div>
    </main>
  );
}
