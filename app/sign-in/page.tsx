import "../atkinson.css";
import Link from "next/link";
import { devLoginEnabled, googleEnabled } from "@/lib/dev-login";
import { googleSignIn } from "./actions";
import DevSignIn from "./DevSignIn";
import DataBackdrop from "./DataBackdrop";
import "./sign-in.css";

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
        <Link href="/" className="pa-brand" aria-label="PDPA Breach Response Tracker home"><span className="pa-brand-mark" aria-hidden="true"><i/><i/><i/><i/></span><span>PDPA<small>Breach Response Tracker</small></span></Link>
      </header>
      <div className="pa-layout">
        <section className="pa-panel" aria-labelledby="pa-sign-in">
          <h1 id="pa-sign-in">Sign in</h1>
          <p className="pa-description">Use the Google account invited by your manager.</p>
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
