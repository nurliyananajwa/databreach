export default function ComingSoon({ sprint, what }: { sprint: number; what: string }) {
  return (
    <main id="main" className="hub-main">
      <div className="hub-card" style={{ maxWidth: 560 }}>
        <span className="hub-tag">Coming in Sprint {sprint}</span>
        <p style={{ marginTop: 12, fontSize: 18, fontWeight: 500, letterSpacing: "-.02em" }}>{what}</p>
      </div>
    </main>
  );
}
