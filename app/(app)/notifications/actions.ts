"use server";

import { revalidatePath } from "next/cache";
import { requirePage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Marks the signed-in person's own alerts as read (RLS allows only their own).
export async function markAllRead() {
  const me = await requirePage("/notifications");
  const db = await createClient();
  await db.from("alerts").update({ read_at: new Date().toISOString() }).eq("user_id", me.id).is("read_at", null);
  revalidatePath("/", "layout");
}
