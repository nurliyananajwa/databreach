"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";
import { describeChange } from "@/lib/activity";
import type { Role } from "@/lib/roles";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import { firstName as greetName } from "@/lib/names";

type Row = RealtimePostgresInsertPayload<Record<string, unknown>>;

type Toast = { id: number; title: string; body: string; href: string; urgent: boolean };

// Listens for new alerts (everyone) and new audit log entries (managers).
// On each event it shows a short pop-up and refreshes the page's data, so
// the bell, the Activity log and the cards update without reloading.
// RLS decides what arrives: you only get your own alerts, and only managers
// get audit log entries.
export default function LiveUpdates({ userId, role }: { userId: string; role: Role }) {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(1);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const db = browserClient();
    const names = new Map<string, string>();
    let cancelled = false;

    const refresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => router.refresh(), 400); // many rows at once = one refresh
    };
    const show = (t: Omit<Toast, "id">) => {
      const id = next.current++;
      setToasts((list) => [...list.slice(-2), { ...t, id }]); // at most 3 on screen
      setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 7000);
    };
    const firstName = async (id: string | null) => {
      if (!id) return "System";
      if (!names.has(id)) {
        const { data } = await db.from("profiles").select("full_name").eq("id", id).maybeSingle();
        names.set(id, greetName(data?.full_name) || "Someone");
      }
      return names.get(id)!;
    };

    let channel: ReturnType<typeof db.channel> | null = null;
    (async () => {
      // Make sure the live connection carries this user's sign-in token.
      const { data } = await db.auth.getSession();
      if (cancelled) return;
      if (data.session) db.realtime.setAuth(data.session.access_token);

      channel = db
        .channel(`live-${userId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts", filter: `user_id=eq.${userId}` }, (p: Row) => {
          const a = p.new as unknown as { message: string; level: string };
          show({ title: a.level === "info" ? "Reminder" : "Deadline", body: a.message, href: "/notifications", urgent: a.level !== "info" });
          refresh();
        });
      if (role === "manager") {
        channel.on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_log" }, async (p: Row) => {
          const e = p.new as unknown as { actor_id: string | null; table_name: string; action: string };
          refresh();
          if (e.actor_id === userId) return; // no pop-up for your own changes
          show({ title: await firstName(e.actor_id), body: describeChange(e.table_name, e.action), href: "/audit", urgent: false });
        });
      }
      channel.subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) db.removeChannel(channel);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [userId, role, router]);

  return (
    <div className="hub-toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <Link key={t.id} href={t.href} className={`hub-toast${t.urgent ? " urgent" : ""}`}>
          <span className="hub-av" aria-hidden="true">{t.urgent ? "!" : t.title.charAt(0)}</span>
          <span><b>{t.title}</b>{t.body}</span>
        </Link>
      ))}
    </div>
  );
}
