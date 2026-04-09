"use client";

import { AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";

export default function EstimateRejectedAlertModal({
  open,
  projectName,
  rejectionReason,
  onClose,
}: {
  open: boolean;
  projectName: string;
  rejectionReason: string | null;
  onClose: () => void;
}) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg rounded-[28px] border border-rose-200 bg-white p-7 shadow-[0_28px_90px_rgba(15,23,42,0.28)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertTriangle size={26} />
        </div>

        <div className="mt-5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-500">
            Estimate Rejected
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-apple-charcoal">
            {projectName || "Project estimate"}
          </h3>
          <p className="mt-3 text-sm leading-7 text-apple-steel">
            The CEO rejected this estimate. Please review the feedback and update the project.
          </p>
        </div>

        <div className="mt-6 rounded-[18px] border border-rose-100 bg-rose-50/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-500">
            Rejection Reason
          </p>
          <p className="mt-2 text-sm leading-7 text-rose-900">
            {rejectionReason?.trim() || "No rejection reason was provided."}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex w-full items-center justify-center rounded-[12px] bg-[#1f6a37] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#18552d]"
        >
          Review project
        </button>
      </div>
    </div>,
    document.body,
  );
}
