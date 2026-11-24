// Plain-English wording for audit log entries, shared by the Activity log
// card and the live pop-ups so they always say the same thing.
const WORDS: Record<string, string> = {
  organisations: "organisation setting", data_sets: "data set", data_fields: "data field", incidents: "incident",
  decisions: "decision", notifications: "notice", tasks: "task", profiles: "user", invitations: "invitation",
  assessments: "assessment", deadlines: "deadline", incident_data_sets: "linked data set", exposed_fields: "exposed field",
};
const ACTION: Record<string, string> = { insert: "added", update: "changed", delete: "removed" };

// "an incident" but "a user": u sounding like "you" takes "a".
const article = (s: string) => (/^(?:[aeio]|u(?!s))/i.test(s) ? "an " : "a ") + s;

/** "Added a decision", "Changed a data set" */
export function describeChange(table: string, action: string) {
  const verb = ACTION[action] ?? action;
  return verb.charAt(0).toUpperCase() + verb.slice(1) + " " + article(WORDS[table] ?? table);
}
