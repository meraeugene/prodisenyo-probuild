"use client";

import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import WorkspaceDialog from "./WorkspaceDialog";
import styles from "./workspace.module.css";

export default function WorkspaceConfirmDialog({ open = true, title, description, confirmLabel, cancelLabel = "Cancel", danger = false, pending = false, onConfirm, onClose, children }: {
  open?: boolean; title: string; description: string; confirmLabel: string; cancelLabel?: string;
  danger?: boolean; pending?: boolean; onConfirm: () => void; onClose: () => void; children?: ReactNode;
}) {
  return <WorkspaceDialog open={open} title={title} description={description} size="sm" pending={pending} onClose={onClose} alert={danger}
    footer={<><button type="button" disabled={pending} onClick={onClose} className={styles.button}>{cancelLabel}</button><button type="button" disabled={pending} onClick={onConfirm} className={danger ? styles.dangerButton : styles.primaryButton}>{pending && <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />}{confirmLabel}</button></>}>
    {children}
  </WorkspaceDialog>;
}
