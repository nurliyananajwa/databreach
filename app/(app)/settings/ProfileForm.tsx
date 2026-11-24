"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveName, type ProfileState } from "./actions";

function Save() {
  const { pending } = useFormStatus();
  return <button type="submit" className="hub-btn" disabled={pending} aria-busy={pending}>{pending ? "Saving…" : "Save name"}</button>;
}

export default function ProfileForm({ name, email, role }: { name: string; email: string; role: string }) {
  const [state, action] = useActionState<ProfileState, FormData>(saveName, {});
  return (
    <form action={action} className="hub-form">
      <label className="hub-field">
        <span>Full name</span>
        <input name="full_name" defaultValue={state.name ?? name} required minLength={2} maxLength={100} autoComplete="name"
          aria-invalid={state.error ? true : undefined} aria-describedby="name-help" />
        <small id="name-help">Shown to your team, in the activity log and on the notices you approve.</small>
      </label>
      <div className="hub-field readonly">
        <span>Email</span>
        <p>{email}</p>
        <small>This is the Google account you were invited with, so it can&apos;t be changed here.</small>
      </div>
      <div className="hub-field readonly">
        <span>Role</span>
        <p>{role}</p>
        <small>Only a Manager can change roles, on the Users page.</small>
      </div>
      <div className="hub-form-foot">
        <Save />
        {state.error && <p role="alert" className="hub-msg-err">{state.error}</p>}
        {state.ok && <p role="status" className="hub-msg-ok">{state.ok}</p>}
      </div>
    </form>
  );
}
