"use client";
import WorkspaceConfirmDialog from "@/components/workspace/WorkspaceConfirmDialog";

export default function CostEstimatorConfirmModal({ open, title, description, confirmLabel, cancelLabel = "Cancel", confirmTone = "danger", pending = false, onConfirm, onCancel }: {
  open: boolean; title: string; description: string; confirmLabel: string; cancelLabel?: string;
  confirmTone?: "danger" | "primary"; eyebrow?: string; pending?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return <WorkspaceConfirmDialog open={open} title={title} description={description} confirmLabel={confirmLabel} cancelLabel={cancelLabel} danger={confirmTone === "danger"} pending={pending} onConfirm={onConfirm} onClose={onCancel} />;
}
