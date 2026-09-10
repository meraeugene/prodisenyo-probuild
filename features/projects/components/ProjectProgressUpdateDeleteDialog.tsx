"use client";

import { useTransition } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
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

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close delete confirmation"
        className="absolute inset-0 cursor-default"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-progress-update-title"
        aria-describedby="delete-progress-update-description"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Trash2 size={20} aria-hidden="true" />
        </span>
        <h2 id="delete-progress-update-title" className="mt-4 text-lg font-semibold text-slate-950">
          Delete progress update?
        </h2>
        <p id="delete-progress-update-description" className="mt-2 text-sm leading-6 text-slate-500">
          This permanently removes this progress entry and cannot be undone.
        </p>
        <p className="mt-4 line-clamp-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
          {update.completed_work_summary}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={pending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            {pending ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <Trash2 size={15} aria-hidden="true" />}
            {pending ? "Deleting..." : "Delete update"}
          </button>
        </div>
      </div>
    </div>
  );
}
