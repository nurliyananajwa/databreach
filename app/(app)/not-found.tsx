import Link from "next/link";
import PageHeader from "@/components/app/PageHeader";
import Icon from "@/components/app/hub/icons";

export const metadata = { title: "Page not found | PDPA Breach Response Tracker" };

// Shown for a wrong address, and for pages your role cannot open (on purpose
// the same message, so it does not reveal that the page exists).
export default function NotFound() {
  return (
    <>
      <PageHeader title="Page not found" intro="This page does not exist, or it is not part of your role." />
      <main id="main" className="hub-main">
        <section className="hub-card hub-view">
          <div className="hub-soon">
            <span className="ic"><Icon name="search" /></span>
            <strong>Nothing here</strong>
            <p>Check the address, or use the menu at the top to go somewhere else.</p>
            <Link href="/home" className="hub-btn">Go to Home</Link>
          </div>
        </section>
      </main>
    </>
  );
}
