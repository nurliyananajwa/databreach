import "server-only";
import { createClient } from "@/lib/supabase/server";

// Active people in the organisation, for the Owner list.
export async function activePeople() {
  const db = await createClient();
  const { data } = await db.from("profiles").select("id, full_name").eq("is_active", true).order("full_name");
  return (data ?? []).map((p) => ({ id: p.id as string, name: p.full_name as string }));
}
