"use client";
import NavigationLink from "@/components/navigation/NavigationLink";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./workspace.module.css";

export default function WorkspaceRouteTabs({ items, label }: { items: readonly { href: string; label: ReactNode; color?: string }[]; label: string }) {
  const pathname = usePathname();
  return <nav aria-label={label} className={styles.tabSwitch}>
    {items.map((item) => <NavigationLink key={item.href} href={item.href} className={styles.switchButton} data-workspace-tab="true"
      data-selected={pathname === item.href} aria-current={pathname === item.href ? "page" : undefined}>
      {item.label}
    </NavigationLink>)}
  </nav>;
}
