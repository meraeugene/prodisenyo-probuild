"use client";

import { useId, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import styles from "./workspace.module.css";
import { useDialogFocusReturn } from "@/features/shared/hooks/useDialogFocusReturn";

export default function WorkspaceDialog({ open = true, title, description, onClose, pending = false, size = "md", children, footer, alert = false, className = "", bodyClassName = "" }: {
  open?: boolean; title: string; description?: string; onClose: () => void; pending?: boolean;
  size?: "sm" | "md" | "lg" | "xl"; children?: ReactNode; footer?: ReactNode; alert?: boolean;
  className?: string; bodyClassName?: string;
}) {
  const descriptionId = useId();
  const returnFocus = useDialogFocusReturn();
  return <Dialog.Root open={open} onOpenChange={value => { if (!value && !pending) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.dialogOverlay} />
      <Dialog.Content role={alert ? "alertdialog" : "dialog"} aria-describedby={description ? descriptionId : undefined} aria-busy={pending} onCloseAutoFocus={returnFocus}
        className={`${styles.dialogContent} ${styles.dialog} ${className}`} data-size={size}
        onEscapeKeyDown={event => { if (pending) event.preventDefault(); }} onInteractOutside={event => { if (pending) event.preventDefault(); }}>
        <header className={styles.dialogHeader}><div className="min-w-0">
          <Dialog.Title className="break-words text-lg font-semibold text-[#101828]">{title}</Dialog.Title>
          {description && <Dialog.Description id={descriptionId} className={styles.description}>{description}</Dialog.Description>}
        </div><Dialog.Close disabled={pending} aria-label="Close dialog" className={styles.dialogClose}><X size={18} aria-hidden="true" /></Dialog.Close></header>
        {children && <div className={`${styles.dialogBody} ${bodyClassName}`}>{children}</div>}
        {footer && <footer className={styles.dialogFooter}>{footer}</footer>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
