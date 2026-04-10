"use client";

import Image from "next/image";
import { createPortal } from "react-dom";

export default function PayrollRejectedAlertModal({
  open,
  siteName,
  periodLabel,
  rejectionReason,
  onClose,
}: {
  open: boolean;
  siteName: string;
  periodLabel: string;
  rejectionReason: string | null;
  onClose: () => void;
}) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[30px] border border-[#d8e9dc] bg-[linear-gradient(180deg,#fcfffd_0%,#f3f8f4_100%)] p-7 shadow-[0_28px_90px_rgba(15,23,42,0.28)] sm:p-8">
        <div className="grid gap-6 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
          <div className="relative mx-auto w-full max-w-[220px]">
            <div className="absolute inset-x-8 bottom-3 h-12 rounded-full bg-[#a9d86c]/30 blur-2xl" />
            <Image
              src="/estimate-rejection-robot.png"
              alt="Friendly robot assistant holding a payroll review document"
              width={768}
              height={768}
              priority
              className="relative z-10 h-auto w-full"
            />
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5b7d63]">
              Payroll Update Needed
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-apple-charcoal">
              {siteName || "Payroll report"}
            </h3>
            <p className="mt-2 text-sm font-medium text-[#5b7d63]">
              {periodLabel || "Current payroll period"}
            </p>
            <p className="mt-3 text-sm leading-7 text-apple-steel">
              This payroll report needs a few revisions before it can move forward. Review the notes below,
              update the payroll, and submit it again when it is ready.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[22px] border border-[#dceadb] bg-white/85 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5b7d63]">
            Review Notes
          </p>
          <p className="mt-2 text-sm leading-7 text-apple-charcoal">
            {rejectionReason?.trim() ||
              "No additional notes were provided, but this payroll report still needs updates before approval."}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex w-full items-center justify-center rounded-[14px] bg-[#2d6a4f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#245540]"
        >
          Review payroll
        </button>
      </div>
    </div>,
    document.body,
  );
}
