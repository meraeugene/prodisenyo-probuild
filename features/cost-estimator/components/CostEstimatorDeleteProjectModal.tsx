import { createPortal } from "react-dom";
import { X } from "lucide-react";
import ButtonLoader from "@/features/budget-tracker/components/ButtonLoader";
import type { ProjectEstimateRow } from "@/features/cost-estimator/types";

export default function CostEstimatorDeleteProjectModal({
  open,
  selectedEstimate,
  pending,
  onClose,
  onDelete,
}: {
  open: boolean;
  selectedEstimate: ProjectEstimateRow | null;
  pending: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  if (!open || !selectedEstimate) return null;

  return createPortal(
    <div className="fixed inset-0 z-[160] bg-black/40">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="absolute left-1/2 top-1/2 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[14px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:w-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-700">
              Delete Project
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-apple-charcoal">
              Delete {selectedEstimate.project_name}?
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-red-200 text-red-500 hover:bg-red-200/40"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-apple-smoke">
          This will permanently remove the current draft project and its item
          costs.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="inline-flex items-center justify-center rounded-[10px] border border-apple-mist px-4 py-3 text-sm font-medium text-apple-charcoal transition hover:border-[#1f6a37]/35 hover:bg-[#f8fbf9] focus-visible:border-[#1f6a37]/45 focus-visible:bg-[#f8fbf9] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="inline-flex items-center justify-center rounded-[10px] border border-rose-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <ButtonLoader label="Deleting project" />
            ) : (
              <span>Delete project</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
