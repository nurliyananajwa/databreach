import Link from "next/link";
import { devLoginEnabled, googleEnabled } from "@/lib/dev-login";
import { googleSignIn } from "./actions";
import DevSignIn from "./DevSignIn";

const ERRORS: Record<string, string> = {
  google: "Google sign-in did not finish. Try again.",
  "google-off": "Google sign-in is not set up yet.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const google = googleEnabled();
  const dev = devLoginEnabled();

  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm font-bold underline decoration-rule decoration-2 underline-offset-4 hover:decoration-ink">
          Back to the home page
        </Link>

        <div className="mt-4 rounded-md border border-rule bg-sheet p-8">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="mt-2 text-muted">
            Use the Google account your manager invited. Accounts that were not invited see nothing.
          </p>

          {error && ERRORS[error] && (
            <p role="alert" className="mt-5 rounded-md border border-stamp/40 bg-stamp/5 px-4 py-3 text-sm text-stamp">
              {ERRORS[error]}
            </p>
          )}

          <form action={googleSignIn} className="mt-6">
            <button
              type="submit"
              disabled={!google}
              className="w-full rounded-md bg-ink px-5 py-3 font-bold text-white hover:bg-[#25335a] disabled:cursor-not-allowed disabled:bg-rule disabled:text-muted"
            >
              Sign in with Google
            </button>
          </form>
          {!google && <p className="mt-2 text-sm text-muted">Google sign-in is being set up.</p>}

          {dev && <DevSignIn />}
        </div>
      </div>
    </main>
  );
}
