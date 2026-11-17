"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import { changeRole, inviteUser, revokeInvitation, setActive, type FormState } from "./actions";

const ROLES = Object.entries(ROLE_LABEL) as [Role, string][];

function Submit({ children, tone = "solid" }: { children: React.ReactNode; tone?: "solid" | "plain" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        tone === "solid"
          ? "rounded-md bg-ink px-4 py-2 font-bold text-white hover:bg-[#25335a] disabled:opacity-60"
          : "rounded-md border-2 border-ink px-3 py-1.5 text-sm font-bold hover:bg-ink hover:text-white disabled:opacity-60"
      }
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

function Message({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="text-sm text-stamp">{state.error}</p>;
  if (state.ok) return <p role="status" className="text-sm text-met">{state.ok}</p>;
  return null;
}

export function InviteForm() {
  const [state, action] = useActionState(inviteUser, {});
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-[1fr_14rem_auto] sm:items-end">
      <label className="grid gap-1.5">
        <span className="text-sm font-bold">Google account email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="off"
          placeholder="name@gmail.com"
          className="rounded-md border border-rule bg-white px-3 py-2"
        />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-bold">Role</span>
        <select name="role" defaultValue="staff" className="rounded-md border border-rule bg-white px-3 py-2">
          {ROLES.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <Submit>Invite</Submit>
      <div className="sm:col-span-3"><Message state={state} /></div>
    </form>
  );
}

export function RoleForm({ userId, role }: { userId: string; role: Role }) {
  const [state, action] = useActionState(changeRole, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="user" value={userId} />
      <label className="sr-only" htmlFor={`role-${userId}`}>Role</label>
      <select id={`role-${userId}`} name="role" defaultValue={role} className="rounded-md border border-rule bg-white px-2 py-1.5 text-sm">
        {ROLES.map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <Submit tone="plain">Change role</Submit>
      <Message state={state} />
    </form>
  );
}

export function ActiveForm({ userId, active }: { userId: string; active: boolean }) {
  const [state, action] = useActionState(setActive, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="user" value={userId} />
      <input type="hidden" name="active" value={String(!active)} />
      <Submit tone="plain">{active ? "Deactivate" : "Reactivate"}</Submit>
      <Message state={state} />
    </form>
  );
}

export function RevokeForm({ invitationId }: { invitationId: string }) {
  const [state, action] = useActionState(revokeInvitation, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="invitation" value={invitationId} />
      <Submit tone="plain">Cancel invitation</Submit>
      <Message state={state} />
    </form>
  );
}
