import "server-only";

// Developer sign-in: on only when DEV_LOGIN=true, and never on the live site.
export function devLoginEnabled() {
  return process.env.DEV_LOGIN === "true" && process.env.VERCEL_ENV !== "production";
}

export function googleEnabled() {
  return process.env.GOOGLE_SIGN_IN === "true";
}
