"use client";

import { useTransition } from "react";
import WorkspaceConfirmDialog from "@/components/workspace/WorkspaceConfirmDialog";
import { toast } from "sonner";
import { deleteProjectProgressUpdateAction } from "@/actions/projects";
import type { ProjectProgressUpdateRecord } from "../progressUpdateTypes";

export default function ProjectProgressUpdateDeleteDialog({
  update,
  onDeleted,
  onClose,
}: {
  update: ProjectProgressUpdateRecord;
  onDeleted: (updateId: string) => void;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      try {
        const updateId = await deleteProjectProgressUpdateAction({
          updateId: update.id,
          projectId: update.project_id,
        });
        onDeleted(updateId);
        toast.success("Progress update deleted.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete progress update.");
      }
    });
  }

  return <WorkspaceConfirmDialog title="Delete progress update?" description="This permanently removes the progress entry and cannot be undone." confirmLabel={pending?'Deleting...':'Delete update'} danger pending={pending} onConfirm={confirmDelete} onClose={onClose}><p className="rounded bg-slate-50 p-3 text-sm text-slate-700">{update.completed_work_summary}</p></WorkspaceConfirmDialog>;
}
