import { requirePage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import NotificationsView, { type Alert } from "./NotificationsView";

export const metadata = { title: "Notifications | Breachfolio" };

export default async function Page() {
  await requirePage("/notifications");
  const db = await createClient();
  const { data, error } = await db.from("alerts").select("id, message, level, deadline_id, read_at, created_at").order("created_at", { ascending: false }).limit(50);
  if (error) console.error(`[notifications] query failed: ${error.message}`);
  return <NotificationsView alerts={(data ?? []) as Alert[]} />;
}
