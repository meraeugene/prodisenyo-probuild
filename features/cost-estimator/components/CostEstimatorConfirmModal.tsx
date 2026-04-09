"use client";

import { LoaderCircle } from "lucide-react";
import { createPortal } from "react-dom";

export default function CostEstimatorConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmTone = "danger",
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmTone?: "danger" | "primary";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onCancel} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-[24px] border border-apple-mist bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.24)]">
        <h3 className="text-xl font-semibold tracking-[-0.03em] text-apple-charcoal">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-7 text-apple-steel">{description}</p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex h-11 items-center justify-center rounded-[12px] border border-apple-mist px-4 text-sm font-semibold text-apple-charcoal transition hover:bg-apple-mist/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`inline-flex h-11 items-center justify-center rounded-[12px] px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              confirmTone === "danger"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-[#1f6a37] hover:bg-[#18552d]"
            }`}
          >
            {pending ? (
              <>
                <LoaderCircle size={15} className="mr-2 animate-spin" />
                {confirmLabel}
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
