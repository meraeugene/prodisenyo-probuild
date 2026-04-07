"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { PayrollSummaryCardDefinition } from "@/features/dashboard/types";
import { formatPayrollNumber } from "@/features/payroll/utils/payrollFormatters";

const PESO_SIGN = "\u20B1";

export default function SummaryFormulaModal({
  card,
  onClose,
}: {
  card: PayrollSummaryCardDefinition | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!card) return;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [card, onClose]);

  if (!card) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-[0_28px_90px_rgba(15,23,42,0.22)]">
        <div className="border-b border-apple-mist bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">
                How It Was Solved
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                {card.title}
              </h2>
              <p className="mt-2 text-sm text-white/75">{card.helper}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
              aria-label="Close payroll formula modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="rounded-[22px] border border-apple-mist bg-[rgb(var(--apple-snow))] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-apple-steel">
              Current Value
            </p>
            <p className="mt-3 text-[34px] font-semibold tracking-[-0.03em] text-apple-charcoal">
              {PESO_SIGN} {formatPayrollNumber(card.amount)}
            </p>
            <p className="mt-3 text-sm text-apple-smoke">{card.formula}</p>
          </div>

          <div className="grid gap-3">
            {card.steps.map((step, index) => (
              <div
                key={step}
                className="flex items-start gap-3 rounded-[18px] border border-apple-mist bg-white px-4 py-3"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-apple-smoke">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
