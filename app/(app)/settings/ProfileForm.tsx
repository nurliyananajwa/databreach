"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Icon, { type IconName } from "@/components/app/hub/icons";
import { saveName, type ProfileState } from "./actions";

function Save() {
  const { pending } = useFormStatus();
  return <button type="submit" className="hub-btn" disabled={pending} aria-busy={pending}>{pending ? "Saving…" : "Save"}</button>;
}

// A read-only row: what it is, the value, and why it can't be changed here.
function Locked({ icon, label, value, why }: { icon: IconName; label: string; value: string; why: string }) {
  return (
    <div className="hub-set-row">
      <span className="ic"><Icon name={icon} /></span>
      <div className="txt"><small>{label}</small><b>{value}</b></div>
      <span className="lock" title={why}><Icon name="lock" className="size-3" />{why}</span>
    </div>
  );
}

// Profile as rows, like a settings list: the name row opens in place to edit.
export default function ProfileForm({ name, email, role }: { name: string; email: string; role: string }) {
  const [state, action] = useActionState<ProfileState, FormData>(saveName, {});
  const [editing, setEditing] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const editBtn = useRef<HTMLButtonElement>(null);
  const backToEdit = useRef(false); // after Save or Cancel, put focus back on Edit
  const close = () => { backToEdit.current = true; setEditing(false); };
  const current = state.ok && state.name ? state.name : name;

  useEffect(() => {
    if (editing) input.current?.select();
    else if (backToEdit.current) { backToEdit.current = false; editBtn.current?.focus(); }
  }, [editing]);
  useEffect(() => { if (state.ok) close(); }, [state]);

  return (
    <div className="hub-set-list">
      <div className={`hub-set-row${editing ? " open" : ""}`}>
        <span className="ic"><Icon name="person" /></span>
        {editing ? (
          <form action={action} className="hub-set-edit" onKeyDown={(e) => { if (e.key === "Escape") close(); }}>
            <label htmlFor="full_name"><small>Full name</small></label>
            <input ref={input} id="full_name" name="full_name" defaultValue={state.name ?? current} required minLength={2} maxLength={100}
              autoComplete="name" aria-invalid={state.error ? true : undefined} aria-describedby="name-help" />
            <small id="name-help" className="help">Shown to your team, in the activity log and on the notices you approve.</small>
            {state.error && <p role="alert" className="hub-msg-err">{state.error}</p>}
            <div className="btns">
              <Save />
              <button type="button" className="hub-btn soft" onClick={close}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <div className="txt"><small>Full name</small><b>{current}</b></div>
            <button ref={editBtn} type="button" className="hub-set-btn" onClick={() => setEditing(true)} aria-label="Edit your name">
              <Icon name="pen" className="size-4" />Edit
            </button>
          </>
        )}
      </div>
      <Locked icon="mail" label="Email" value={email} why="From your Google sign-in" />
      <Locked icon="shield" label="Role" value={role} why="Set by a Manager" />
      {state.ok && !editing && <p role="status" className="hub-msg-ok"><Icon name="check" className="size-4" />{state.ok}</p>}
    </div>
  );
}
