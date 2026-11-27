import Link from "next/link";
import { devLoginEnabled, googleEnabled } from "@/lib/dev-login";
import { googleSignIn } from "./actions";
import DevSignIn from "./DevSignIn";
import DataBackdrop from "./DataBackdrop";
import "@fontsource-variable/manrope/wght.css";
import "./sign-in.css";

export const metadata = { title: "Sign in · Data Breach" };

const ERRORS: Record<string, string> = {
  google: "Google sign-in did not finish. Please try again.",
  "google-off": "Your organisation's Google sign-in is not available yet.",
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const google = googleEnabled();
  const dev = devLoginEnabled();
  return <main className="pdpa-auth">
    <div className="pa-shell">
      <header className="pa-header">
        <Link href="/" className="pa-brand" aria-label="Data Breach home">
          <svg aria-hidden="true" width="40" height="40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  
  <rect x="1" y="1" width="46" height="46" rx="12" fill="#36385f" stroke="#a8adc7"/>
  <path d="M11 13.5 24 8l12 5.5-12 5.8z" fill="#fff0c7"/>
  <path d="m11 17 10.8 5.1v17L11 33.6z" fill="#b4a7ee"/>
  <path d="m25 22.1 12-5.7v7.3l-12 5.7zm0 10.7 12-5.7v6.1l-12 5.7z" fill="#a3e5df"/>
</svg>
          <span>Data Breach</span>
        </Link>
      </header>
      <div className="pa-layout">
        <section className="pa-panel" aria-labelledby="pa-sign-in">
          <h1 id="pa-sign-in">Sign in</h1>
          <p className="pa-description">Use the Google account your manager invited to this workspace.</p>
          {error && ERRORS[error] && <p role="alert" className="pa-error">{ERRORS[error]}</p>}
          <form action={googleSignIn} className="pa-google-form"><button type="submit" disabled={!google} className="pa-google-button"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.8 12.2c0-.7-.1-1.4-.2-2.1H12v4.1h5.5a4.7 4.7 0 0 1-2 3.1 6.1 6.1 0 1 1-3.5-11c1.5 0 2.8.5 3.9 1.5l3-3A10.2 10.2 0 1 0 12 22c5.9 0 9.8-4.2 9.8-9.8Z"/></svg><span>Sign in with Google</span><span aria-hidden="true">↗</span></button></form>
          {!google && <p className="pa-availability" role="status">Google sign-in is not available yet.{!dev && <> Please contact your manager for access.</>}</p>}
          {dev && <details className="pa-dev-access"><summary>Development access</summary><DevSignIn /></details>}
          <Link href="/" className="pa-return">Back to home</Link>
        </section>
      </div>
    </div>
    <DataBackdrop />
  </main>;
}
