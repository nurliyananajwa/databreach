import { requirePage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import PageHeader from "@/components/app/PageHeader";
import { ActiveForm, InviteForm, RevokeForm, RoleForm } from "./forms";

export const metadata = { title: "Users | PDPA Breach Response Tracker" };

const kl = new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeZone: "Asia/Kuala_Lumpur" });

export default async function UsersPage() {
  const me = await requirePage("/users");
  const db = await createClient();

  const [{ data: users, error: usersError }, { data: invites }] = await Promise.all([
    db.from("profiles").select("id, full_name, email, role, is_active, created_at").order("full_name"),
    db
      .from("invitations")
      .select("id, email, role, created_at")
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <PageHeader here="/users"
        title="Users"
        intro="Invite people with their Google account and give each one a role. Only invited accounts can see anything."
      />

      <main id="main" className="hub-main">
      <section className="hub-card" aria-labelledby="invite-heading">
        <h2 id="invite-heading" className="text-lg font-bold">Invite someone</h2>
        <p className="mt-1 mb-5 text-sm text-muted">
          They get access the first time they sign in with this Google account.
        </p>
        <InviteForm />
      </section>

      <section className="hub-card mt-4" aria-labelledby="people-heading">
        <h2 id="people-heading" className="text-lg font-bold">People ({users?.length ?? 0})</h2>
        {usersError && <p role="alert" className="mt-3 text-stamp">Could not load users: {usersError.message}</p>}
        <div className="mt-4 overflow-x-auto rounded-md border border-rule bg-sheet">
          <table className="w-full min-w-[44rem] text-left text-[0.95rem]">
            <thead className="border-b border-rule text-sm text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-normal">Name</th>
                <th scope="col" className="px-4 py-3 font-normal">Role</th>
                <th scope="col" className="px-4 py-3 font-normal">Status</th>
                <th scope="col" className="px-4 py-3 font-normal">Change</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((u) => {
                const isMe = u.id === me.id;
                return (
                  <tr key={u.id} className="border-b border-rule last:border-0 align-top">
                    <td className="px-4 py-3">
                      <span className="font-bold">{u.full_name}</span>
                      {isMe && <span className="ml-2 text-sm text-muted">(you)</span>}
                      <span className="block text-sm text-muted">{u.email}</span>
                    </td>
                    <td className="px-4 py-3">{ROLE_LABEL[u.role as Role]}</td>
                    <td className="px-4 py-3">
                      {u.is_active ? (
                        <span className="text-met">Active</span>
                      ) : (
                        <span className="text-stamp">Deactivated</span>
                      )}
                      <span className="block text-sm text-muted">Since {kl.format(new Date(u.created_at))}</span>
                    </td>
                    <td className="px-4 py-3">
                      {isMe ? (
                        <span className="text-sm text-muted">You cannot change your own role or access.</span>
                      ) : (
                        <div className="grid gap-2">
                          <RoleForm userId={u.id} role={u.role as Role} />
                          <ActiveForm userId={u.id} active={u.is_active} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="hub-card mt-4" aria-labelledby="pending-heading">
        <h2 id="pending-heading" className="text-lg font-bold">Waiting to sign in ({invites?.length ?? 0})</h2>
        {invites && invites.length > 0 ? (
          <ul className="mt-4 divide-y divide-rule rounded-md border border-rule bg-sheet">
            {invites.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span>
                  <span className="font-bold">{inv.email}</span>
                  <span className="block text-sm text-muted">
                    {ROLE_LABEL[inv.role as Role]}, invited {kl.format(new Date(inv.created_at))}
                  </span>
                </span>
                <RevokeForm invitationId={inv.id} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-muted">Nobody is waiting. Invite someone above.</p>
        )}
      </section>
      </main>
    </>
  );
}
