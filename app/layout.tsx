import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDPA Breach Response Tracker",
  description:
    "Record the personal data your business holds, respond to a breach within the legal deadlines, and keep a complete breach register.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-MY">
      <body>{children}</body>
    </html>
  );
}
