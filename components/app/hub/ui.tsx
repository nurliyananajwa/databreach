import Link from "next/link";
import Icon, { type IconName } from "./icons";

export function Card({ icon, title, sub, href, delay = 0, className = "", children }: {
  icon: IconName; title: string; sub?: string; href?: string; delay?: number; className?: string; children: React.ReactNode;
}) {
  return (
    <section className={`hub-card ${className}`} style={{ animationDelay: `${delay}s` }}>
      <div className="hub-ch">
        <div>
          <h2><Icon name={icon} />{title}</h2>
          {sub && <p className="sub">{sub}</p>}
        </div>
        {href && <Link href={href} className="hub-go" aria-label={`Open ${title}`}><Icon name="arrow" className="size-4" /></Link>}
      </div>
      {children}
    </section>
  );
}

// "Barcode" meter: n thin bars, the first `on` filled. Bars from `hotFrom` on turn red.
export function Bars({ n = 48, on, tone = "on", hotFrom }: { n?: number; on: number; tone?: "on" | "hot" | "ok"; hotFrom?: number }) {
  return (
    <div className="hub-bars" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <i key={i} className={i < on ? (hotFrom !== undefined && i >= hotFrom ? "hot" : tone) : ""} style={{ animationDelay: `${0.15 + i * 0.008}s` }} />
      ))}
    </div>
  );
}

export function Empty({ title, body, href, cta }: { title: string; body: string; href?: string; cta?: string }) {
  return (
    <div className="hub-empty">
      <strong>{title}</strong>
      <p>{body}</p>
      {href && cta && <Link href={href} className="hub-btn soft">{cta} →</Link>}
    </div>
  );
}
