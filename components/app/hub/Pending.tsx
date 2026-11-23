"use client";

import { useLinkStatus } from "next/link";

// Put inside a <Link>: while that link's page is loading, a thin bar runs
// across the top of the screen. (A loading.tsx screen would do this too, but
// it makes blocked pages answer 200 instead of 404, so we don't use one.)
export default function Pending() {
  const { pending } = useLinkStatus();
  return pending ? <span className="hub-pending" role="progressbar" aria-label="Loading page" /> : null;
}
