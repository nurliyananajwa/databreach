import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rolesFor, type Role } from "@/lib/roles";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  orgId: string;
  orgName: string;
};

// The signed-in user's profile, once per request. Redirects if there is none.
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, org_id, is_active, organisations(name)")
    .eq("id", user.id)
    .maybeSingle();

  // Signed in with Google/email, but never invited (or deactivated).
  if (!profile || !profile.is_active) redirect("/not-invited");

  const org = profile.organisations as unknown as { name: string } | null;
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role as Role,
    orgId: profile.org_id,
    orgName: org?.name ?? "",
  };
});

// Use at the top of every page. Wrong role = "page not found", so the
// page's existence is not revealed.
export async function requirePage(href: string): Promise<CurrentUser> {
  const me = await getCurrentUser();
  if (!rolesFor(href).includes(me.role)) notFound();
  return me;
}

export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const me = await getCurrentUser();
  if (!roles.includes(me.role)) notFound();
  return me;
}
