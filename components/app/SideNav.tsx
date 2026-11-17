"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MenuItem } from "@/lib/roles";

export default function SideNav({ items }: { items: Pick<MenuItem, "href" | "label">[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="App">
      <ul className="grid gap-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-md border-l-[3px] px-3 py-2 text-[0.95rem] ${
                  active
                    ? "border-stamp bg-wash font-bold"
                    : "border-transparent text-muted hover:bg-wash hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
