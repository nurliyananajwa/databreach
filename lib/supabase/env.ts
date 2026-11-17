// Clear message instead of Supabase's generic one when .env.local is missing.
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase settings are missing. Put the .env.local file in the project folder " +
        "(the same folder as package.json), then stop and restart `npm run dev`.",
    );
  }
  return { url, key };
}
