"use client";

import { createBrowserClient } from "@supabase/ssr";

// Supabase client for the browser, used only for live updates. It carries the
// signed-in user's session, so RLS decides which events they receive.
let client: ReturnType<typeof createBrowserClient> | null = null;

export function browserClient() {
  if (!client) {
    client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  }
  return client;
}
