import Link from "next/link";
import { devLoginEnabled, googleEnabled } from "@/lib/dev-login";
import { googleSignIn } from "./actions";
import DevSignIn from "./DevSignIn";
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
      <Link href="/" className="pa-brand" aria-label="PDPA Breach Response Tracker home"><span className="pa-brand-mark" aria-hidden="true"><i/><i/><i/><i/></span><span>PDPA<small>Breach Response Tracker</small></span></Link>
      <div className="pa-layout">
        <section className="pa-intro" aria-labelledby="pa-welcome"><p className="pa-eyebrow">YOUR TEAM. ONE CONNECTED RESPONSE.</p><h2 id="pa-welcome">Bring the facts.<br/><em>Keep the clarity.</em></h2><p>Access your organisation's data inventory, incident reports and assigned response work.</p><ol className="pa-steps"><li><span>01</span>Know where the data lives.</li><li><span>02</span>Work through the response together.</li><li><span>03</span>Keep decisions and actions connected.</li></ol><Link href="/#scenario-controls" className="pa-return"><span aria-hidden="true">←</span> Back to the interactive demo</Link></section>
        <section className="pa-panel" aria-labelledby="pa-sign-in"><p className="pa-eyebrow">YOUR ORGANISATION'S WORKSPACE</p><h1 id="pa-sign-in">Sign in</h1><p className="pa-description">Use the Google account invited by your manager. Access is managed by your organisation.</p>
          {error && ERRORS[error] && <p role="alert" className="pa-error">{ERRORS[error]}</p>}
          <form action={googleSignIn} className="pa-google-form"><button type="submit" disabled={!google} className="pa-google-button"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.8 12.2c0-.7-.1-1.4-.2-2.1H12v4.1h5.5a4.7 4.7 0 0 1-2 3.1 6.1 6.1 0 1 1-3.5-11c1.5 0 2.8.5 3.9 1.5l3-3A10.2 10.2 0 1 0 12 22c5.9 0 9.8-4.2 9.8-9.8Z"/></svg><span>Sign in with Google</span><span aria-hidden="true">↗</span></button></form>
          {!google && <div className="pa-availability" role="status"><strong>Google sign-in is not available yet.</strong><p>{dev ? "You can explore the workspace with the local test accounts below." : "Please contact your manager about access, or return to the interactive demo."}</p>{!dev&&<Link href="/#scenario-controls">Explore the demo →</Link>}</div>}
          {dev && <DevSignIn/>}
          <p className="pa-access-note">Your role and access come from your manager's invitation.</p>
        </section>
      </div>
    </div>
  </main>;
}
