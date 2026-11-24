// Shown at once when you open another page, while its data is on the way, so
// a click never feels stuck. Same shapes as a real page: header, then cards.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="hub-band hub-band-page" style={{ marginTop: -1 }}>
        <div className="hub-hero">
          <div>
            <span className="hub-skel" style={{ width: 140, height: 12 }} />
            <span className="hub-skel" style={{ width: 360, height: 52, marginTop: 14 }} />
            <span className="hub-skel" style={{ width: 300, height: 14, marginTop: 16 }} />
          </div>
        </div>
      </div>
      <main id="main" className="hub-main">
        <div className="hub-skel-grid">
          {[0, 1, 2].map((i) => <div key={i} className="hub-card hub-skel-card" style={{ animationDelay: `${i * 0.06}s` }} />)}
        </div>
      </main>
    </div>
  );
}
