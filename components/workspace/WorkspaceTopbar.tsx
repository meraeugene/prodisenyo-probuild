import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { SidebarProfile } from "@/features/navigation/types";
import styles from "./workspace.module.css";

const WORKSPACE_TITLES: Partial<Record<NonNullable<SidebarProfile>["role"], string>> = {
  ceo: "Executive workspace",
  admin: "Administration workspace",
  payroll_manager: "Payroll workspace",
  employee: "Employee workspace",
  purchaser: "Purchasing workspace",
  gmea: "GMEA workspace",
  engineer: "Engineering workspace",
};

export function hasCompactWorkspace(role: SidebarProfile["role"] | undefined) {
  return Boolean(role && WORKSPACE_TITLES[role]);
}

export default function WorkspaceTopbar({ profile }: { profile: SidebarProfile }) {
  const title = WORKSPACE_TITLES[profile.role] || "Workspace";
  const displayName = profile.full_name?.trim() || profile.username || title;
  return <header data-workspace-header className={styles.topbar}>
    <strong>{title}</strong>
    <span>Prodisenyo Builders &amp; GMEA</span>
    <Link href="/settings" className={styles.accountLink} aria-label={`Account settings for ${displayName}`}>
      <span className={styles.avatar} aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</span>
      <span>{displayName}</span><ChevronDown size={13} aria-hidden="true" />
    </Link>
  </header>;
}
