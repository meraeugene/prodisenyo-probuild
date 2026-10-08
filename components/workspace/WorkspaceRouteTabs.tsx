"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./workspace.module.css";

export default function WorkspaceRouteTabs({ items, label }: { items: readonly { href: string; label: ReactNode; color?: string }[]; label: string }) {
  const pathname = usePathname();
  return <nav aria-label={label} className={styles.tabSwitch}>
    {items.map((item) => <Link key={item.href} href={item.href} prefetch={false} className={styles.switchButton} data-workspace-tab="true"
      data-selected={pathname === item.href} aria-current={pathname === item.href ? "page" : undefined}>
      {item.label}
    </Link>)}
  </nav>;
}
