import type { ReactNode } from "react";
import styles from "./ceoWorkspace.module.css";

export default function CeoPageHeader({ eyebrow, title, description, actions }: {
  eyebrow: string; title: string; description: string; actions?: ReactNode;
}) {
  return <header className={styles.header}>
    <div>
      <p className={styles.eyebrow}>Workspace <span aria-hidden="true">/</span> {eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
    </div>
    {actions && <div className={styles.headerActions}>{actions}</div>}
  </header>;
}
