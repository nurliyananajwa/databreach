"use client";

import { useId, useState } from "react";

const ROLES = [
  {
    id: "staff", name: "Staff", summary: "Report what happened and help with the response.",
    actions: [
      { when: "When you notice an incident", title: "Report the suspected breach", detail: "Describe what happened and when you noticed it. You can follow the status of your own report." },
      { when: "During the response", title: "Complete assigned tasks", detail: "Carry out the actions assigned to you, such as changing a password, and record the result." },
      { when: "Throughout", title: "See the information you need", detail: "Access your own reports and assigned work without opening other staff members’ confidential cases." },
    ],
  },
  {
    id: "compliance", name: "Compliance Officer", summary: "Confirm the facts, explain the decision and coordinate the response.",
    actions: [
      { when: "Before and during an incident", title: "Maintain the inventory and confirm exposure", detail: "Record data categories and check which fields and people were actually affected. The inventory is a starting point for review." },
      { when: "During assessment", title: "Review the criteria and record a decision", detail: "Consider the incident context, resolve unanswered questions and document the notification decision with a reason." },
      { when: "During response and closure", title: "Coordinate tasks and prepare notification drafts", detail: "Assign response work, prepare drafts for manager review, record external sending and close the incident with its history." },
    ],
  },
  {
    id: "manager", name: "Manager", summary: "Give the team access, review drafts and oversee outstanding work.",
    actions: [
      { when: "Before an incident", title: "Invite the team", detail: "Give each invited colleague the appropriate role and manage their access." },
      { when: "When a draft is ready", title: "Review the notification", detail: "Approve the draft or return it for revision. Approval does not send a notification or pause a deadline." },
      { when: "Throughout the response", title: "Keep oversight", detail: "Review case progress, outstanding tasks, deadline escalations and the breach register." },
    ],
  },
] as const;

export default function Journey() {
  const [selected, setSelected] = useState<(typeof ROLES)[number]["id"]>("staff");
  const id = useId();
  const role = ROLES.find((item) => item.id === selected)!;

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a role to explore">
        {ROLES.map((item) => (
          <button key={item.id} type="button" aria-pressed={selected === item.id} aria-controls={`${id}-panel`}
            onClick={() => setSelected(item.id)}
            className={`rounded-md border px-4 py-2 text-sm font-bold transition-colors ${selected === item.id ? "border-ink bg-ink text-white" : "border-rule bg-white hover:border-ink"}`}>
            {item.name}
          </button>
        ))}
      </div>

      <section id={`${id}-panel`} aria-labelledby={`${id}-title`} className="mt-6 overflow-hidden rounded-xl border border-rule bg-white">
        <div className="border-b border-rule px-5 py-5 sm:px-6">
          <h3 id={`${id}-title`} className="text-xl font-bold">{role.name}</h3>
          <p className="mt-1 text-muted">{role.summary}</p>
        </div>
        <ol className="grid gap-6 p-5 sm:p-6 lg:grid-cols-3">
          {role.actions.map((action, index) => (
            <li key={action.title}>
              <span className="grid size-8 place-items-center rounded-full bg-paper text-sm font-bold" aria-hidden="true">{index + 1}</span>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted">{action.when}</p>
              <h4 className="mt-1 font-bold leading-snug">{action.title}</h4>
              <p className="mt-2 text-[0.95rem] text-muted">{action.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-5 grid gap-4 border-t border-rule pt-5 sm:grid-cols-3" aria-label="How the tracker supports the team">
        <div><p className="font-bold">Track time</p><p className="mt-1 text-sm text-muted">Keep applicable deadlines and approaching alerts visible.</p></div>
        <div><p className="font-bold">Explain the checks</p><p className="mt-1 text-sm text-muted">Show the inputs, flagged criteria and questions still needing review.</p></div>
        <div><p className="font-bold">Keep a history</p><p className="mt-1 text-sm text-muted">Record the team’s actions, decisions and response timeline.</p></div>
      </div>
      <p className="mt-5 max-w-3xl text-sm text-muted">People review and make decisions. The tracker helps coordinate the work and preserve the record; it never sends notifications on your behalf.</p>
    </div>
  );
}
