export type Role = "staff" | "dp_lead" | "manager";

export const ROLE_LABEL: Record<Role, string> = {
  staff: "Staff",
  dp_lead: "Data protection lead",
  manager: "Manager",
};

export type MenuItem = { href: string; label: string; roles: Role[] };

// One list drives the menu AND the page guards, so they cannot disagree.
// The database enforces the same rules again with RLS.
export const MENU: MenuItem[] = [
  { href: "/home", label: "Home", roles: ["staff", "dp_lead", "manager"] },
  { href: "/dashboard", label: "Dashboard", roles: ["manager"] },
  { href: "/report", label: "Report a breach", roles: ["staff", "dp_lead", "manager"] },
  { href: "/my-reports", label: "My reports", roles: ["staff"] },
  { href: "/incidents", label: "Incidents", roles: ["dp_lead", "manager"] },
  { href: "/approvals", label: "Approvals", roles: ["manager"] },
  { href: "/inventory", label: "Data inventory", roles: ["dp_lead", "manager"] },
  { href: "/tasks", label: "Tasks", roles: ["staff", "dp_lead", "manager"] },
  { href: "/register", label: "Breach register", roles: ["dp_lead", "manager"] },
  { href: "/users", label: "Users", roles: ["manager"] },
  { href: "/audit", label: "Audit log", roles: ["manager"] },
];

export function menuFor(role: Role) {
  return MENU.filter((m) => m.roles.includes(role));
}

export function rolesFor(href: string): Role[] {
  return MENU.find((m) => m.href === href)?.roles ?? [];
}
