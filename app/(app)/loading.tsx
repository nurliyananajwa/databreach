// Shown by Next.js while any signed-in page is loading, so a click gets an
// instant response instead of a frozen screen. The top bar stays in place.
export default function Loading() {
  return (
    <div className="hub-loading" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="hub-band hub-band-page" style={{ marginTop: -1 }} aria-hidden="true">
        <div className="hub-hero">
          <div style={{ width: "100%" }}>
            <div className="hub-skel" style={{ width: 160, height: 12 }} />
            <div className="hub-skel" style={{ width: "min(420px, 80%)", height: 44, marginTop: 14 }} />
            <div className="hub-skel" style={{ width: "min(340px, 70%)", height: 14, marginTop: 14 }} />
          </div>
        </div>
      </div>
      <main className="hub-main" aria-hidden="true">
        <div className="hub-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="hub-card skel">
              <div className="hub-skel" style={{ width: "55%", height: 14 }} />
              <div className="hub-skel" style={{ width: "40%", height: 10 }} />
              <div className="hub-skel" style={{ width: "35%", height: 40, marginTop: 10 }} />
              <div className="hub-skel" style={{ height: 26, marginTop: "auto" }} />
            </div>
          ))}
          <div className="hub-card skel hub-side" style={{ minHeight: 300 }}>
            <div className="hub-skel" style={{ width: "50%", height: 14 }} />
            {[0, 1, 2].map((i) => <div key={i} className="hub-skel" style={{ height: 44 }} />)}
          </div>
        </div>
      </main>
    </div>
  );
}
