"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export type ProfileState = { error?: string; ok?: string; name?: string };

// Changes only the signed-in person's own name. The database function checks
// again (2 to 100 characters, active account) and the audit log records it.
export async function saveName(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  await getCurrentUser();
  const name = String(form.get("full_name") ?? "").replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 100) return { error: "Your name must be 2 to 100 characters.", name };
  const db = await createClient();
  const { error } = await db.rpc("update_my_name", { p_full_name: name });
  if (error) return { error: "Your name could not be saved. Please try again.", name };
  revalidatePath("/", "layout"); // the greeting, avatar and menu use the name
  return { ok: "Saved. Your new name shows everywhere now.", name };
}
