import Link from "next/link";
import { requirePage } from "@/lib/auth";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import PageHeader from "@/components/app/PageHeader";

export const metadata = { title: "Home | PDPA Breach Response Tracker" };

const JOBS: Record<Role, { href: string; title: string; body: string }[]> = {
  staff: [
    { href: "/report", title: "Report a breach", body: "Something went wrong with personal data? Report it straight away, even if you are not sure." },
    { href: "/my-reports", title: "My reports", body: "See what happened to the breaches you reported." },
    { href: "/tasks", title: "My tasks", body: "Work your data protection lead gave you." },
  ],
  dp_lead: [
    { href: "/incidents", title: "Incidents", body: "Confirm what was exposed, run the assessment and record your decision." },
    { href: "/inventory", title: "Data inventory", body: "Keep the list of personal data, where it is kept and who can open it, up to date." },
    { href: "/tasks", title: "Tasks", body: "Give follow-up work to staff and track it." },
    { href: "/register", title: "Breach register", body: "Every breach, notified or not, in one place." },
  ],
  manager: [
    { href: "/approvals", title: "Approvals", body: "Approve notification drafts before your lead sends them." },
    { href: "/dashboard", title: "Dashboard", body: "Open incidents, deadlines and the register at a glance." },
    { href: "/users", title: "Users", body: "Invite people and give each one a role." },
    { href: "/audit", title: "Audit log", body: "See who changed what, and when." },
  ],
};

export default async function HomePage() {
  const me = await requirePage("/home");
  const firstName = me.fullName.split(" ")[0];

  return (
    <>
      <PageHeader
        title={`Hello, ${firstName}`}
        intro={`You are signed in as ${ROLE_LABEL[me.role].toLowerCase()} for ${me.orgName}.`}
      />
      <ul className="mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
        {JOBS[me.role].map((job) => (
          <li key={job.href}>
            <Link
              href={job.href}
              className="block h-full rounded-md border border-rule bg-sheet p-5 hover:border-ink"
            >
              <span className="text-lg font-bold">{job.title}</span>
              <span className="mt-1 block text-muted">{job.body}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
