import Link from "next/link";

// Placeholder until Google sign-in is connected to Supabase (wireframe 4.2).
export default function SignInPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-sm rounded-md border border-rule bg-sheet p-8">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-3 text-muted">
          Google sign-in is connected in the next step of Sprint 1.
        </p>
        <Link href="/" className="mt-6 inline-block font-bold underline underline-offset-4">
          Back to the home page
        </Link>
      </div>
    </main>
  );
}
