"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { devLoginEnabled, googleEnabled } from "@/lib/dev-login";

const TEST_ACCOUNTS = {
  manager: "manager@test.local",
  dp_lead: "lead@test.local",
  staff: "staff@test.local",
} as const;

export type SignInState = { error?: string };

export async function devSignIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  if (!devLoginEnabled() || !process.env.DEV_TEST_PASSWORD) {
    return { error: "Developer sign-in is turned off." };
  }
  const role = String(formData.get("role"));
  // Only the three listed roles; a crafted value like "constructor" is refused.
  if (!Object.hasOwn(TEST_ACCOUNTS, role)) return { error: "Unknown test account." };
  const email = TEST_ACCOUNTS[role as keyof typeof TEST_ACCOUNTS];

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: process.env.DEV_TEST_PASSWORD,
  });
  if (error) {
    return {
      error: /fetch failed|network/i.test(error.message)
        ? "Could not reach the sign-in service. Check your internet connection and try again."
        : "Sign-in failed. Check that the test accounts exist and the password in .env.local is right.",
    };
  }

  const { error: claimError } = await supabase.rpc("claim_invitation");
  if (claimError) {
    await supabase.auth.signOut();
    redirect("/not-invited");
  }
  redirect("/home");
}

// Google sign-in (used once the Google provider is enabled in Supabase).
export async function googleSignIn() {
  if (!googleEnabled()) redirect("/sign-in?error=google-off");
  const supabase = await createClient();
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) redirect("/sign-in?error=google");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  // "local" ends this browser's session without waiting on other devices.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/sign-in");
}
