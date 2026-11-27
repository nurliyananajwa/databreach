import { requirePage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/app/PageHeader";
import ReportForm from "./ReportForm";
import Icon from "@/components/app/hub/icons";

export const metadata = { title: "Report a breach | Breachfolio" };

export default async function Page() {
  const db = await createClient();
  // Names only: staff can see which data sets exist, not what is in them.
  const [me, { data }] = await Promise.all([requirePage("/report"), db.rpc("list_data_set_names")]);
  const sets = ((data ?? []) as { id: string; name: string }[]);
  return (
    <>
      <PageHeader title="Report a breach" intro="Tell the Compliance Officer what happened. Report it even if you are not sure. It takes about two minutes." />
      <main id="main" className="hub-main">
        <div className="rep-grid">
          <ReportForm sets={sets} followHref={me.role === "staff" ? "/my-reports" : "/incidents"} />
          <aside className="rep-side">
            <section className="hub-card">
              <div className="hub-ch"><div><h2><Icon name="log" />What happens next</h2></div></div>
              <ol className="rep-next">
                <li>The Compliance Officer is told straight away.</li>
                <li>They check which data actually left your control.</li>
                <li>They decide if the Commissioner must be told within 72 hours. {me.role === "staff" ? "You can follow it in My reports." : ""}</li>
              </ol>
            </section>
            <section className="hub-card">
              <div className="hub-ch"><div><h2><Icon name="clock" />Don&apos;t wait to be sure</h2></div></div>
              <p className="rep-side-p">A report that turns out to be nothing is fine. A late report can break the 72-hour rule.</p>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
