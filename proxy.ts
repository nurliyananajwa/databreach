import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Pages anyone can open without signing in.
const PUBLIC_PATHS = ["/", "/sign-in", "/not-invited", "/auth", "/opengraph-image"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || (p !== "/" && pathname.startsWith(p + "/")));
}

// Next.js 16: this file was middleware.ts. It runs on the Node.js runtime.
// It refreshes the session and sends signed-out visitors to /sign-in; every
// page also checks the user itself (requirePage), so this is not the only guard.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Public pages need no session, so they work even before setup is finished.
  if (isPublic(request.nextUrl.pathname)) return response;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Supabase settings are missing. Put the .env.local file in the project folder " +
        "(the same folder as package.json), then stop and restart `npm run dev`.",
    );
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
        },
      },
    },
  );

  // Refreshes the session cookie. Must run before any redirect decision.
  // getClaims() checks the sign-in token's signature on our server, so it does
  // not need a round trip to Supabase on every page (getUser() always did).
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  // Skip static files and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
