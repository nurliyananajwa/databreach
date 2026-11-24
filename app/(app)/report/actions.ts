"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { INCIDENT_TYPES, type IncidentType } from "@/lib/incidents";

export type ReportState = { error?: string; sent?: { id: string; code: string } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PLAIN = /^(Title and description|Awareness time|Choose what kind|Unknown data set)/;

export async function reportBreach(_prev: ReportState, form: FormData): Promise<ReportState> {
  await getCurrentUser(); // every role may report
  const title = String(form.get("title") ?? "").replace(/\s+/g, " ").trim();
  const description = String(form.get("description") ?? "").trim();
  const date = String(form.get("date") ?? "");
  const time = String(form.get("time") ?? "");
  const type = String(form.get("type") ?? "") as IncidentType;
  const sets = form.getAll("sets").map(String).filter((s) => UUID.test(s));

  if (title.length < 3) return { error: "Write what happened in one line (at least 3 characters)." };
  if (title.length > 160) return { error: "Keep the one-line summary under 160 characters." };
  if (description.length < 10) return { error: "Describe what happened in a few words (at least 10 characters)." };
  if (description.length > 4000) return { error: "Keep the description under 4,000 characters." };
  if (!INCIDENT_TYPES.includes(type)) return { error: "Choose what kind of breach it is." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return { error: "Enter the date and time the business found out." };

  // The form is in Malaysian time.
  const awareAt = new Date(`${date}T${time}:00+08:00`);
  if (Number.isNaN(awareAt.getTime())) return { error: "That date or time is not valid." };
  if (awareAt.getTime() > Date.now() + 60_000) return { error: "The time you found out cannot be in the future." };

  const db = await createClient();
  const { data: id, error } = await db.rpc("report_incident", {
    p_title: title, p_description: description, p_aware_at: awareAt.toISOString(), p_data_sets: sets, p_type: type,
  });
  if (error || !id) return { error: error && PLAIN.test(error.message) ? error.message : "The report could not be sent. Please try again." };

  const { data: row } = await db.from("incidents").select("code").eq("id", id).single();
  revalidatePath("/home");
  revalidatePath("/my-reports");
  revalidatePath("/incidents");
  return { sent: { id: id as string, code: row?.code ?? "your report" } };
}
