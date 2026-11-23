import "./atkinson.css";
import { signOut } from "@/app/sign-in/actions";

export default function NotInvitedPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-md rounded-md border border-rule bg-sheet p-8">
        <h1 className="text-2xl font-bold">This account has no access</h1>
        <p className="mt-3 text-muted">
          Your manager has not invited this account, or it has been deactivated. Ask your manager to
          invite the Google account you signed in with.
        </p>
        <form action={signOut} className="mt-6">
          <button type="submit" className="rounded-md border-2 border-ink px-4 py-2 font-bold hover:bg-ink hover:text-white">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
