import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google sends the user back here with a one-time code.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/sign-in?error=google`);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/sign-in?error=google`);

  // Turns a manager's invitation into a profile on first sign-in.
  const { error: claimError } = await supabase.rpc("claim_invitation");
  if (claimError) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/not-invited`);
  }
  return NextResponse.redirect(`${origin}/home`);
}
