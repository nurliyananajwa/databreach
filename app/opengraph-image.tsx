import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The picture shown when the link is shared (WhatsApp, Telegram, reports).
export const alt = "PDPA Breach Response Tracker: respond to a personal data breach within the legal deadlines";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const chip = (t: string, red = false) => (
  <div
    style={{
      display: "flex",
      padding: "6px 14px",
      borderRadius: 6,
      border: `2px solid ${red ? "rgba(179,38,30,0.45)" : "#d9dde5"}`,
      color: red ? "#b3261e" : "#17213a",
      fontSize: 24,
    }}
  >
    {t}
  </div>
);

const font = (w: number) =>
  readFile(join(process.cwd(), `node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-${w}-normal.woff`));

export default async function OpenGraphImage() {
  const [regular, bold] = await Promise.all([font(400), font(700)]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#17213a", color: "#fff", padding: 72, fontFamily: "Atkinson" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 560, justifyContent: "space-between" }}>
          <div style={{ fontSize: 28, opacity: 0.8 }}>PDPA Breach Response Tracker</div>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2 }}>A data breach just happened. What do you do?</div>
          <div style={{ fontSize: 26, opacity: 0.7 }}>Record your data. Meet the 72-hour deadline. Keep the proof.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: "auto", width: 470, background: "#fff", color: "#17213a", borderRadius: 18, overflow: "hidden", alignSelf: "center" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "16px 26px", background: "#f5f7f6", fontSize: 22 }}>
            <span style={{ fontWeight: 700 }}>INC-011</span>
            <span style={{ marginLeft: 14, color: "#5b6475" }}>Online shop</span>
            <span style={{ marginLeft: "auto", background: "#b3261e", color: "#fff", padding: "4px 10px", borderRadius: 5, fontSize: 18, fontWeight: 700 }}>Notice needed</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", padding: 26 }}>
            <div style={{ fontSize: 30, fontWeight: 700 }}>Hackers copied the customer database.</div>
            <div style={{ fontSize: 22, color: "#5b6475", marginTop: 6 }}>4,800 people affected</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
              {chip("Full name")}
              {chip("Phone number")}
              {chip("Card details", true)}
            </div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 24, gap: 18 }}>
              <div style={{ display: "flex", flexShrink: 0, width: 104, height: 104, borderRadius: 52, border: "9px solid #b3261e", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700 }}>72h</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 20, color: "#5b6475" }}>Commissioner deadline</div>
                <div style={{ fontSize: 26, fontWeight: 700 }}>72 hours from awareness</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Atkinson", data: regular, weight: 400, style: "normal" },
        { name: "Atkinson", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
