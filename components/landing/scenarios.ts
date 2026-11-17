// Example breaches for the landing page simulator. Illustrative only.
// These simplified public-demo prompts do not replace the authenticated assessment.
// No real case, database decision or notification is created here.

export type Category = "identity" | "contact" | "financial" | "sensitive" | "other";
export type Field = { name: string; category: Category };

export const BUSINESSES = [
  { id: "shop", label: "Online shop" },
  { id: "restaurant", label: "Restaurant" },
  { id: "tuition", label: "Tuition centre" },
  { id: "clinic", label: "Clinic" },
  { id: "salon", label: "Salon" },
  { id: "logistics", label: "Logistics" },
] as const;

export const INCIDENTS = [
  { id: "laptop", label: "Laptop stolen" },
  { id: "email", label: "Email to the wrong person" },
  { id: "hack", label: "Database hacked" },
  { id: "whatsapp", label: "WhatsApp leak" },
] as const;

export type BusinessId = (typeof BUSINESSES)[number]["id"];
export type IncidentId = (typeof INCIDENTS)[number]["id"];

const F = {
  name: { name: "Full name", category: "other" },
  phone: { name: "Phone number", category: "contact" },
  email: { name: "Email", category: "contact" },
  address: { name: "Home address", category: "contact" },
  ic: { name: "IC number", category: "identity" },
  bank: { name: "Bank account", category: "financial" },
  salary: { name: "Salary", category: "financial" },
  card: { name: "Card details", category: "financial" },
  photo: { name: "Photo", category: "other" },
  dob: { name: "Date of birth", category: "other" },
  health: { name: "Health details", category: "sensitive" },
} satisfies Record<string, Field>;

const f = (name: string, category: Category): Field => ({ name, category });

type Scenario = { what: string; people: number; fields: Field[] };

export const SCENARIOS: Record<BusinessId, Record<IncidentId, Scenario>> = {
  shop: {
    laptop: { what: "Staff payroll file was on the stolen laptop", people: 12, fields: [F.name, F.ic, F.bank, F.salary] },
    email: { what: "Today's order list went to the wrong courier", people: 85, fields: [F.name, F.phone, F.address] },
    hack: { what: "Hackers copied the customer database", people: 4800, fields: [F.name, F.email, F.phone, F.address, F.card] },
    whatsapp: { what: "Customer chat screenshots shared in a group", people: 40, fields: [F.name, F.phone] },
  },
  restaurant: {
    laptop: { what: "Reservation list was on the stolen laptop", people: 1350, fields: [F.name, F.phone] },
    email: { what: "Staff payslips emailed to the wrong person", people: 18, fields: [F.name, F.ic, F.salary] },
    hack: { what: "Online booking system was hacked", people: 2100, fields: [F.name, F.email, F.phone] },
    whatsapp: { what: "Staff group shared a customer's complaint", people: 3, fields: [F.name, F.phone] },
  },
  tuition: {
    laptop: { what: "Student records were on the stolen laptop", people: 180, fields: [f("Student name", "other"), f("Parent IC number", "identity"), f("Parent phone", "contact"), F.address] },
    email: { what: "Exam results emailed to the wrong parent", people: 25, fields: [f("Student name", "other"), f("School", "other"), f("Exam results", "other")] },
    hack: { what: "Registration form database was hacked", people: 640, fields: [f("Student name", "other"), F.dob, f("Parent IC number", "identity"), f("Parent phone", "contact"), f("Fee payment details", "financial")] },
    whatsapp: { what: "Parents' group saw another child's details", people: 1, fields: [f("Student name", "other"), f("Parent phone", "contact")] },
  },
  clinic: {
    laptop: { what: "Appointment list was on the stolen laptop", people: 300, fields: [F.name, F.phone, f("Reason for visit", "sensitive")] },
    email: { what: "Lab results sent to the wrong patient", people: 1, fields: [F.name, F.ic, f("Lab results", "sensitive")] },
    hack: { what: "Patient database was hacked", people: 9500, fields: [F.name, F.ic, F.phone, F.address, f("Medical history", "sensitive")] },
    whatsapp: { what: "Staff group shared a patient's photo", people: 1, fields: [F.name, F.photo, F.health] },
  },
  salon: {
    laptop: { what: "Client list was on the stolen laptop", people: 450, fields: [F.name, F.phone, F.dob] },
    email: { what: "Membership list emailed to a supplier", people: 1100, fields: [F.name, F.phone, F.email] },
    hack: { what: "Booking app account was hacked", people: 760, fields: [F.name, F.phone, F.email, F.card] },
    whatsapp: { what: "Before-and-after photos posted to the wrong group", people: 6, fields: [F.name, F.photo] },
  },
  logistics: {
    laptop: { what: "Driver files were on the stolen laptop", people: 35, fields: [F.name, F.ic, f("Driving licence number", "identity"), F.phone] },
    email: { what: "Delivery list sent to the wrong customer", people: 220, fields: [f("Recipient name", "other"), F.phone, F.address] },
    hack: { what: "Parcel tracking system was hacked", people: 26000, fields: [f("Recipient name", "other"), F.phone, F.address] },
    whatsapp: { what: "Driver shared parcel labels in a public group", people: 15, fields: [f("Recipient name", "other"), F.phone, F.address] },
  },
};

export type RuleResult = { code: string; label: string; met: boolean | null; why: string };
export type Verdict = "both" | "commissioner" | "register";

export function assess(s: Scenario): { rules: RuleResult[]; verdict: Verdict } {
  const has = (c: Category) => s.fields.some((x) => x.category === c);
  const identity = has("identity");
  const contactOrMoney = has("contact") || has("financial");

  const rules: RuleResult[] = [
    {
      code: "SCALE",
      label: "More than 1,000 people",
      met: s.people > 1000,
      why: `${s.people.toLocaleString("en-MY")} ${s.people === 1 ? "person" : "people"} affected`,
    },
    { code: "SENSITIVE", label: "Sensitive data", met: has("sensitive"), why: has("sensitive") ? "Health or other sensitive data" : "None exposed" },
    { code: "FINANCIAL", label: "Financial data to review", met: has("financial"), why: has("financial") ? "Bank, card or salary data" : "No financial data" },
    {
      code: "IDENTITY",
      label: "Identity information to review",
      met: identity && contactOrMoney,
      why: identity ? (contactOrMoney ? "ID number with contact or money data" : "An ID number still needs contextual review") : "No ID number in this sample; context still needs review",
    },
    { code: "JUDGEMENT", label: "Physical harm or illegal misuse", met: null, why: "Your Compliance Officer reviews the context" },
  ];

  const harm = rules.some((r) => r.code !== "SCALE" && r.met === true);
  const scale = rules[0].met === true;
  return { rules, verdict: harm ? "both" : scale ? "commissioner" : "register" };
}

export const VERDICT_TEXT: Record<Verdict, { title: string; body: string }> = {
  both: {
    title: "Tell the Commissioner and the people affected",
    body: "This sample flags both notification routes. The Compliance Officer confirms the decision and applicable deadlines.",
  },
  commissioner: {
    title: "Tell the Commissioner",
    body: "This sample flags the Commissioner route. Notification to affected people needs a separate review.",
  },
  register: {
    title: "Record it in your breach register",
    body: "The sample has no automatic flags. The Compliance Officer must still review the context and record the decision.",
  },
};
