// The top of every signed-in page: continues the teal band with a big, light title.
// Pages without their own hero (Users, Inventory...) get the same look for free.
const today = new Intl.DateTimeFormat("en-MY", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" });

export default function PageHeader({ title, intro, eyebrow, big = false, art = false, children }: {
  title: string; intro?: string; eyebrow?: string; big?: boolean; art?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className="hub-band on-dark" style={{ marginTop: -1 }}>
      {art && (
        <div className="hub-glass" aria-hidden="true">
          <div className="s s1" /><div className="s s2" />
          <div className="sh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
          </div>
        </div>
      )}
      <div className={`hub-hero${big ? " big" : ""}`}>
        <div>
          <small>{eyebrow ?? today.format(new Date())}</small>
          <h1>{title}</h1>
          {intro && <p>{intro}</p>}
        </div>
        {children && <div className="actions">{children}</div>}
      </div>
    </div>
  );
}
