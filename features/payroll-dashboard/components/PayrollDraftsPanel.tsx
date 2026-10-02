import Link from "next/link";

import type { PayrollDraftRow } from "@/features/payroll-dashboard/types";
import {
  formatPayrollCurrency,
  formatPayrollDate,
} from "@/features/payroll-dashboard/utils/payrollDashboard";

export default function PayrollDraftsPanel({
  drafts,
}: {
  drafts: PayrollDraftRow[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-bold text-slate-950">Payroll Drafts</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Saved work that has not been submitted for CEO review
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {drafts.length ? drafts.map((draft) => {
          const query = new URLSearchParams();
          if (draft.attendanceImportId) {
            query.set("importId", draft.attendanceImportId);
          }
          query.set("runId", draft.id);
          const canContinue = Boolean(draft.attendanceImportId);

          return (
            <div
              key={draft.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">
                  {draft.siteName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {draft.periodLabel} · Updated {formatPayrollDate(draft.updatedAt)}
                </p>
              </div>
              <p className="text-sm font-bold text-slate-800">
                {formatPayrollCurrency(draft.netTotal)}
              </p>
              {canContinue ? (
                <Link
                  href={`/generate-payroll?${query.toString()}`}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-sky-700 px-4 text-xs font-bold text-white transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
                >
                  Continue Draft
                </Link>
              ) : (
                <span className="text-xs font-semibold text-slate-400">
                  Attendance source unavailable
                </span>
              )}
            </div>
          );
        }) : (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-bold text-slate-800">No saved payroll drafts</p>
            <p className="mt-1 text-xs text-slate-500">Start by uploading a new attendance file.</p>
          </div>
        )}
      </div>
    </section>
  );
}
