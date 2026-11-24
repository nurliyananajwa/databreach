// Shared by the Inventory pages and their server actions.

export const CATEGORIES = ["identity", "contact", "financial", "sensitive", "other"] as const;
export type Category = (typeof CATEGORIES)[number];

// Plain-English labels and the hint shown under each one. The categories are
// what the assessment rules in Sprint 3 read, so the hints say why they matter.
export const CATEGORY: Record<Category, { label: string; hint: string }> = {
  identity: { label: "Identity", hint: "IC or passport number, staff ID" },
  contact: { label: "Contact", hint: "Phone, email, home address" },
  financial: { label: "Financial", hint: "Bank account, card, salary" },
  sensitive: { label: "Sensitive", hint: "Health, religion, criminal records (PDPA sensitive data)" },
  other: { label: "Other", hint: "Name, job title, anything else" },
};

export type FieldInput = { id?: string | null; name: string; category: Category; sensitive: boolean };

export type DataSetInput = {
  name: string;
  storage_location: string;
  access: string;
  purpose: string;
  retention: string;
  owner: string;
  processor: string;
  records: string;
};

// The inventory stores field NAMES only. Something that looks like a real value
// (an IC or phone number, an email address) is refused here and in the database.
export function looksLikeRealData(name: string): boolean {
  return /\d{6,}|\d{3,}[- ]\d{3,}|[^ @]+@[^ @]+\.[a-z]/.test(name);
}
