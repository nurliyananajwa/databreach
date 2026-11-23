"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/app/hub/icons";
import Pending from "@/components/app/hub/Pending";

export function BellLink({ unread }: { unread: number }) {
  const here = usePathname() === "/notifications";
  return (
    <Link
      href="/notifications"
      className="hub-bell"
      aria-current={here ? "page" : undefined}
      aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
    >
      <Icon name="bell" className="size-5" />
      {!!unread && <span className="hub-badge" aria-hidden="true">{unread > 9 ? "9+" : unread}</span>}
      <Pending />
    </Link>
  );
}
