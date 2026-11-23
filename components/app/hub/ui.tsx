import Link from "next/link";
import Icon, { type IconName } from "./icons";
import Pending from "./Pending";

export function Card({ icon, title, sub, href, delay = 0, className = "", tour, children }: {
  icon: IconName; title: string; sub?: string; href?: string; delay?: number; className?: string; tour?: string; children: React.ReactNode;
}) {
  return (
    <section className={`hub-card ${className}`} style={{ animationDelay: `${delay}s` }} data-tour={tour}>
      <div className="hub-ch">
        <div>
          <h2><Icon name={icon} />{title}</h2>
          {sub && <p className="sub">{sub}</p>}
        </div>
        {href && <Link href={href} className="hub-view" aria-label={`View ${title}`}>View<Pending /></Link>}
      </div>
      {children}
    </section>
  );
}

// Hour-cell meter: n small squares, 24 per row, the first `on` filled.
// Cells from `hotFrom` on turn coral.
export function Bars({ n = 48, on, tone = "on", hotFrom }: { n?: number; on: number; tone?: "on" | "hot" | "ok"; hotFrom?: number }) {
  return (
    <div className="hub-bars" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <i key={i} className={i < on ? (hotFrom !== undefined && i >= hotFrom ? "hot" : tone) : ""} style={{ animationDelay: `${0.15 + i * 0.012}s` }} />
      ))}
    </div>
  );
}

// Empty card: an icon, what this card will show, and one next step if there is one.
export function Empty({ title, body, href, cta, icon = "check" }: { title: string; body: string; href?: string; cta?: string; icon?: IconName }) {
  return (
    <div className="hub-empty">
      <span className="ic" aria-hidden="true"><Icon name={icon} /></span>
      <strong>{title}</strong>
      <p>{body}</p>
      {href && cta && <Link href={href} className="hub-btn soft">{cta} →<Pending /></Link>}
    </div>
  );
}
