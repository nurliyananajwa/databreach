"use client";

import { useFormStatus } from "react-dom";

// Shows that the click worked, and blocks double clicks while signing out.
export default function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="hub-out" disabled={pending} aria-busy={pending}>
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
