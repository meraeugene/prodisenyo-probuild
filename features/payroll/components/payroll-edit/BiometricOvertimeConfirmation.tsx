"use client";
import { Check, X } from "lucide-react";
import { formatPayrollNumber } from "@/features/payroll/utils/payrollFormatters";
type Props = { status: "approved" | "rejected"; biometricOvertimeHours: number; onClose: () => void; onConfirm: () => void };
export default function BiometricOvertimeConfirmation({ status, biometricOvertimeHours, onClose, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-apple-mist bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <div className="flex items-start gap-3 border-b border-apple-mist px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-apple-steel">
              Confirm Overtime
            </p>
            <h3 className="mt-1 text-lg font-semibold text-apple-charcoal">
              {status === "approved"
                ? "Include biometric overtime in final pay?"
                : "Exclude biometric overtime from final pay?"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-apple-steel">
              {status === "approved"
                ? `This will add ${formatPayrollNumber(biometricOvertimeHours)} biometric overtime hour(s) to the employee's final total pay.`
                : "This will keep biometric overtime out of the employee's final total pay."}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-apple-silver px-4 text-sm font-semibold text-apple-ash transition hover:border-apple-charcoal"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            {status === "approved" ? (
              <>
                <Check size={15} />
                Confirm Overtime
              </>
            ) : (
              <>
                <X size={15} />
                Exclude Overtime
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
