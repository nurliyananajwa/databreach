"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { devSignIn, type SignInState } from "./actions";
import { ROLE_LABEL } from "@/lib/roles";

const ACCOUNTS = [
  { role: "manager", label: ROLE_LABEL.manager, who: "Najwa" },
  { role: "dp_lead", label: ROLE_LABEL.dp_lead, who: "Farid" },
  { role: "staff", label: ROLE_LABEL.staff, who: "Siti" },
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
      className="pa-account-button"
    >
      <span>{label}</span>
      <span>{busy ? "Signing in…" : who}</span>
    </button>
  );
}

export default function DevSignIn() {
  const [state, action] = useActionState<SignInState, FormData>(devSignIn, {});
  return (
    <section className="pa-dev" aria-labelledby="dev-heading">
      <h2 id="dev-heading">Local test access</h2>
      <p>
        Test accounts for building the system. Turned off on the live site.
      </p>
      <form action={action}>
        {ACCOUNTS.map((a) => (
          <AccountButton key={a.role} {...a} />
        ))}
      </form>
      {state.error && (
        <p role="alert" className="pa-error">
          {state.error}
        </p>
      )}
    </section>
  );
}
