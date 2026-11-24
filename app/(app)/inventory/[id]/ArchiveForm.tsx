"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setArchived, type SaveState } from "../actions";

function Button({ archived }: { archived: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={archived ? "hub-btn" : "hub-btn soft"} disabled={pending} aria-busy={pending}>
      {pending ? "One moment…" : archived ? "Restore data set" : "Archive data set"}
    </button>
  );
}

// Data sets are never deleted (the breach register must be able to show what
// was held); archiving hides them from new breach reports instead.
export default function ArchiveForm({ id, archived }: { id: string; archived: boolean }) {
  const [state, action] = useActionState<SaveState, FormData>(setArchived, {});
  return (
    <form action={action} className="inv-archive">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="archived" value={archived ? "false" : "true"} />
      <p>{archived
        ? "Archived data sets are kept for the record but are not offered when someone reports a breach."
        : "No longer used? Archive it. It stays in the record and in past incidents, but is not offered for new reports."}</p>
      <Button archived={archived} />
      {state.error && <p role="alert" className="hub-msg-err">{state.error}</p>}
    </form>
  );
}
