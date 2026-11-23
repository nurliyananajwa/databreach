import type { Metadata } from "next";
import "./globals.css";

// Absolute base for link previews: the Vercel address when deployed, else local.
const site = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: "PDPA Breach Response Tracker",
  description:
    "Record the personal data your business holds, respond to a breach within the legal deadlines, and keep a complete breach register.",
  openGraph: {
    title: "PDPA Breach Response Tracker",
    description: "Record your data. Meet the 72-hour deadline. Keep the proof.",
    type: "website",
    locale: "en_MY",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-scroll-behavior: Next.js 16 turns smooth scrolling off while it
    // changes pages, so a new page opens at the top instantly.
    <html lang="en-MY" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
