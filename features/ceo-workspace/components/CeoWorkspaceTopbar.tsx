import Link from "next/link";
import { ChevronDown } from "lucide-react";
import styles from "./ceoWorkspace.module.css";

export default function CeoWorkspaceTopbar({ name }: { name: string | null }) {
  const displayName = name?.trim() || "CEO";
  return <header className={styles.topbar}>
    <strong>Executive workspace</strong>
    <span>Prodisenyo Builders &amp; GMEA</span>
    <Link href="/settings" className={styles.accountLink} aria-label={`Account settings for ${displayName}`}>
      <span className={styles.avatar} aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</span>
      <span>{displayName}</span><ChevronDown size={13} aria-hidden="true" />
    </Link>
  </header>;
}
