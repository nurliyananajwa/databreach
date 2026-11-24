import PageHeader from "@/components/app/PageHeader";
import { Empty } from "@/components/app/hub/ui";
import { markAllRead } from "./actions";

const kl = new Intl.DateTimeFormat("en-MY", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kuala_Lumpur" });

export type Alert = { id: string; message: string; level: string; read_at: string | null; created_at: string };

// Draws the Notifications page. Kept apart from page.tsx (which loads the
// data) so it can also be checked with sample alerts.
export default function NotificationsView({ alerts }: { alerts: Alert[] }) {
  const unread = alerts.filter((a) => !a.read_at).length;
  return (
    <>
      <PageHeader here="/notifications" title="Notifications" intro="Deadline reminders and things that need you. Newest first.">
        {unread > 0 && (
          <form action={markAllRead}>
            <button type="submit" className="hub-pill-light" style={{ cursor: "pointer", border: 0 }}>Mark all as read ({unread})</button>
          </form>
        )}
      </PageHeader>
      <main id="main" className="hub-main">
        <div className="hub-card" style={{ maxWidth: 760 }}>
          {alerts.length ? (
            <div className="hub-feed" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
              {alerts.map((a) => (
                <div key={a.id} className={`hub-msg${a.level !== "info" && !a.read_at ? " alert" : ""}`} style={{ opacity: a.read_at ? 0.6 : 1 }}>
                  <span className="hub-av" aria-hidden="true">!</span>
                  <div>
                    <span className="meta"><b>{a.level !== "info" ? "Deadline" : "Reminder"}{!a.read_at && <span className="sr-only"> (unread)</span>}</b><time>{kl.format(new Date(a.created_at))}</time></span>
                    <p>{a.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty icon="bell" title="No notifications" body="You'll be told when a breach is reported, a notice needs approval, a task is given to you, and 24 and 6 hours before a deadline." />
          )}
        </div>
      </main>
    </>
  );
}
