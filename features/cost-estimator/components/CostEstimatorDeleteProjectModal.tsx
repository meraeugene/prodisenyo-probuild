"use client";
import WorkspaceConfirmDialog from "@/components/workspace/WorkspaceConfirmDialog";
import type { ProjectEstimateRow } from "../types";

export default function CostEstimatorDeleteProjectModal({ open, selectedEstimate, pending, onClose, onDelete }: {
  open: boolean; selectedEstimate: ProjectEstimateRow | null; pending: boolean; onClose: () => void; onDelete: () => void;
}) {
  return <WorkspaceConfirmDialog open={open && selectedEstimate !== null} title={`Delete ${selectedEstimate?.project_name ?? "draft"}?`} description="This permanently removes the draft estimate and its item costs." confirmLabel={pending ? "Deleting..." : "Delete draft"} danger pending={pending} onConfirm={onDelete} onClose={onClose} />;
}
