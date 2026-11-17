"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export type FormState = { error?: string; ok?: string };

// Every action re-checks the role here, and the database checks it again.
async function run(fn: (db: Awaited<ReturnType<typeof createClient>>) => PromiseLike<{ error: { message: string } | null }>, ok: string): Promise<FormState> {
  await requireRole("manager");
  const db = await createClient();
  const { error } = await fn(db);
  if (error) return { error: error.message };
  revalidatePath("/users");
  return { ok };
}

export async function inviteUser(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const role = String(form.get("role") ?? "");
  if (!email) return { error: "Enter an email address." };
  return run((db) => db.rpc("invite_user", { p_email: email, p_role: role }), `Invitation saved for ${email}.`);
}

export async function changeRole(_prev: FormState, form: FormData): Promise<FormState> {
  return run(
    (db) => db.rpc("set_user_role", { p_user: String(form.get("user")), p_role: String(form.get("role")) }),
    "Role changed.",
  );
}

export async function setActive(_prev: FormState, form: FormData): Promise<FormState> {
  const active = form.get("active") === "true";
  return run(
    (db) => db.rpc("set_user_active", { p_user: String(form.get("user")), p_active: active }),
    active ? "Account reactivated." : "Account deactivated.",
  );
}

export async function revokeInvitation(_prev: FormState, form: FormData): Promise<FormState> {
  return run((db) => db.rpc("revoke_invitation", { p_invitation: String(form.get("invitation")) }), "Invitation cancelled.");
}
