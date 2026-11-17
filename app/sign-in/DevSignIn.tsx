"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { devSignIn, type SignInState } from "./actions";

const ACCOUNTS = [
  { role: "manager", label: "Manager", who: "Aisyah" },
  { role: "dp_lead", label: "Data protection lead", who: "Farid" },
  { role: "staff", label: "Staff", who: "Siti" },
];

function AccountButton({ role, label, who }: (typeof ACCOUNTS)[number]) {
  const { pending, data } = useFormStatus();
  const busy = pending && data?.get("role") === role;
  return (
    <button
      type="submit"
      name="role"
      value={role}
      disabled={pending}
      className="flex w-full items-center justify-between rounded-md border-2 border-ink px-4 py-2.5 text-left font-bold hover:bg-ink hover:text-white disabled:opacity-60"
    >
      <span>{label}</span>
      <span className="text-sm font-normal">{busy ? "Signing in…" : who}</span>
    </button>
  );
}

export default function DevSignIn() {
  const [state, action] = useActionState<SignInState, FormData>(devSignIn, {});
  return (
    <section className="mt-8 border-t border-dashed border-rule pt-6" aria-labelledby="dev-heading">
      <h2 id="dev-heading" className="font-bold">Developer sign-in</h2>
      <p className="mt-1 text-sm text-muted">
        Test accounts for building the system. Turned off on the live site.
      </p>
      <form action={action} className="mt-4 grid gap-2">
        {ACCOUNTS.map((a) => (
          <AccountButton key={a.role} {...a} />
        ))}
      </form>
      {state.error && (
        <p role="alert" className="mt-3 text-sm text-stamp">
          {state.error}
        </p>
      )}
    </section>
  );
}
