"use client";
import { Send } from "lucide-react";
type Props = { site: string; attendancePeriod: string; isPending: boolean; onClose: () => void; onConfirm: () => void };
export default function PayrollSubmitConfirmation({ site, attendancePeriod, isPending, onClose, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm ">
      <div className="w-full max-w-xl rounded-[24px] border border-transparent bg-white shadow-workspace">
        <div className="border-b border-apple-mist px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-apple-steel">
                Submit Payroll Report
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-apple-charcoal">
                Submit this payroll report for the current period?
              </h2>
              <p className="mt-2 text-sm leading-6 text-apple-steel">
                This will submit the payroll report for{" "}
                <span className="font-semibold text-apple-charcoal">
                  {site}
                </span>{" "}
                and place it in the CEO payroll report review queue.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid gap-3 rounded-[20px] border border-apple-mist bg-[linear-gradient(180deg,#f8fffd,#f6faf8)] p-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
                Site
              </p>
              <p className="mt-1 text-sm font-semibold text-apple-charcoal">
                {site}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
                Payroll Period
              </p>
              <p className="mt-1 text-sm font-semibold text-apple-charcoal">
                {attendancePeriod}
              </p>
            </div>
          </div>

          <div className="rounded-[18px] border border-teal-200 bg-teal-50 px-4 py-3">
            <p className="text-sm leading-6 text-teal-900">
              This submits the payroll report as pending CEO review. It will
              only appear in the CEO dashboard totals after the CEO accepts
              it. Only overtime requests continue through the separate
              approval flow.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-apple-mist px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-apple-silver px-4 text-sm font-semibold text-apple-ash transition hover:border-apple-charcoal disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#076d69] px-5 text-sm font-semibold text-white transition hover:bg-[#055f5b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={15} />
            Confirm Submission
          </button>
        </div>
      </div>
    </div>
  );
}
