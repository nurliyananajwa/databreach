// Shared by the incident pages, the report form and their server actions.

export const INCIDENT_TYPES = [
  "unauthorised_access", "lost_stolen", "wrong_recipient", "accidental_disclosure", "malware", "insider_misuse", "other",
] as const;
export type IncidentType = (typeof INCIDENT_TYPES)[number];

export const TYPE_LABEL: Record<IncidentType, string> = {
  unauthorised_access: "Hacking or unauthorised access",
  lost_stolen: "Lost or stolen device or paper",
  wrong_recipient: "Sent to the wrong person",
  accidental_disclosure: "Accidentally shared or published",
  malware: "Ransomware or malware",
  insider_misuse: "Misuse by an insider",
  other: "Other",
};

export const STATUS_LABEL: Record<string, string> = {
  reported: "Reported", assessing: "Assessing", decided: "Decided",
  notified: "Notified", follow_up: "Follow-up", closed: "Closed",
};

// An alert's small label: deadline alerts carry a deadline, new-report alerts do not.
export function alertLabel(a: { level: string; deadline_id?: string | null }) {
  if (!a.deadline_id) return "New report";
  return a.level === "info" ? "Reminder" : "Deadline";
}
