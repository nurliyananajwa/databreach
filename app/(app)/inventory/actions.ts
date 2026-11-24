"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, looksLikeRealData, type FieldInput } from "@/lib/inventory";

export type SaveState = { error?: string; ok?: string };

// Messages the database writes for people; anything else is a generic error.
const PLAIN = /^(Name must|Storage location|Purpose is|Retention period|Number of records|The owner|Fields must|Each field|A field|Two fields|Restore the|Only the Compliance|Data set not found)/;

function readFields(raw: string): FieldInput[] | string {
  let list: unknown;
  try { list = JSON.parse(raw); } catch { return "The field list could not be read. Please try again."; }
  if (!Array.isArray(list)) return "The field list could not be read. Please try again.";
  const out: FieldInput[] = [];
  for (const f of list) {
    const name = String(f?.name ?? "").replace(/\s+/g, " ").trim();
    const category = String(f?.category ?? "") as FieldInput["category"];
    if (!name) continue; // empty rows are simply left out
    if (!CATEGORIES.includes(category)) return `Choose a category for "${name}".`;
    if (looksLikeRealData(name)) return `"${name}" looks like real personal data. Enter the name of the field only, such as "Phone number".`;
    out.push({ id: f?.id || null, name, category, sensitive: category === "sensitive" || Boolean(f?.sensitive) });
  }
  return out;
}

export async function saveDataSet(_prev: SaveState, form: FormData): Promise<SaveState> {
  await requireRole("dp_lead");
  const id = String(form.get("id") ?? "") || null;
  const fields = readFields(String(form.get("fields") ?? "[]"));
  if (typeof fields === "string") return { error: fields };

  const text = (k: string) => String(form.get(k) ?? "").trim();
  const recordsRaw = text("records").replace(/[,\s]/g, "");
  if (recordsRaw && !/^\d{1,9}$/.test(recordsRaw)) return { error: "Approximate number of records must be a whole number." };

  const db = await createClient();
  const before = id ? (await db.from("data_sets").select("version_no").eq("id", id).single()).data?.version_no : null;
  const { data, error } = await db.rpc("save_data_set", {
    p_id: id,
    p_name: text("name"),
    p_storage_location: text("storage_location"),
    p_access: text("access"),
    p_purpose: text("purpose"),
    p_retention: text("retention"),
    p_owner: text("owner") || null,
    p_processor: text("processor"),
    p_records: recordsRaw ? Number(recordsRaw) : null,
    p_fields: fields,
  });
  if (error) return { error: PLAIN.test(error.message) ? error.message : "The data set could not be saved. Please try again." };

  revalidatePath("/inventory");
  revalidatePath("/home");
  if (!id) redirect(`/inventory/${data}?saved=new`);

  const { data: row } = await db.from("data_sets").select("version_no").eq("id", id).single();
  if (row?.version_no === before) return { ok: "Nothing changed, so no new version was made." };
  revalidatePath(`/inventory/${id}`);
  return { ok: `Saved as version ${row?.version_no}.` };
}

export async function setArchived(_prev: SaveState, form: FormData): Promise<SaveState> {
  await requireRole("dp_lead");
  const id = String(form.get("id") ?? "");
  const archived = form.get("archived") === "true";
  const db = await createClient();
  const { error } = await db.rpc("set_data_set_status", { p_id: id, p_archived: archived });
  if (error) return { error: "That could not be changed. Please try again." };
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  revalidatePath("/home");
  return { ok: archived ? "Archived. It is kept for the record but no longer offered when reporting a breach." : "Restored." };
}
