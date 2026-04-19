"use client";

import { LoaderCircle, X } from "lucide-react";
import { createPortal } from "react-dom";

export default function CostEstimatorConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmTone = "danger",
  eyebrow,
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
  eyebrow?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[160] bg-black/40">
      <div className="absolute inset-0" onClick={onCancel} aria-hidden="true" />
      <div className="absolute left-1/2 top-1/2 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[14px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:w-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            {confirmTone === "danger" ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-700">
                {eyebrow ?? "Delete Action"}
              </p>
            ) : null}
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-apple-charcoal">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-[10px] border transition disabled:cursor-not-allowed disabled:opacity-60 ${
              confirmTone === "danger"
                ? "border-red-200 text-red-500 hover:bg-red-200/40"
                : "border-apple-mist text-apple-steel hover:bg-apple-mist/40"
            }`}
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-3 text-sm leading-7 text-apple-steel">{description}</p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex h-11 items-center justify-center rounded-[10px] border border-apple-mist px-4 text-sm font-medium text-apple-charcoal transition hover:border-[#1f6a37]/35 hover:bg-[#f8fbf9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`inline-flex h-11 items-center justify-center rounded-[10px] px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              confirmTone === "danger"
                ? "border-0 bg-red-600 text-white hover:bg-red-700"
                : "bg-[#1f6a37] text-white hover:bg-[#18552d]"
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
