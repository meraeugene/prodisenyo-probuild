import { Check } from "lucide-react";
import type { RecentPayrollActivityRow } from "@/features/dashboard/hooks/useHistoricalDashboardData";

export default function DashboardRecentActivitySection({
  activityRows,
  attendancePeriod,
}: {
  activityRows: RecentPayrollActivityRow[];
  attendancePeriod: string;
}) {
  return (
    <section className="rounded-[12px] bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
      <div className="mb-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <p className="text-[15px] font-semibold text-apple-charcoal">
          Recent Payroll Activity
        </p>
        <p className="text-xs text-emerald-500">{attendancePeriod}</p>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-apple-mist">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[1fr_1.2fr_1fr_0.9fr_1fr] bg-[rgb(var(--apple-snow))] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-500">
              <span>Type</span>
              <span>Employee</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Branch</span>
            </div>

            <div className="divide-y divide-apple-mist">
              {activityRows.length > 0 ? (
                activityRows.map((row) => (
                  <div
                    key={`${row.type}-${row.employee}`}
                    className="grid grid-cols-[1fr_1.2fr_1fr_0.9fr_1fr] items-center px-4 py-4"
                  >
                    <span className="text-sm font-medium text-apple-ash">
                      {row.type}
                    </span>
                    <span className="text-sm font-semibold text-apple-charcoal">
                      {row.employee}
                    </span>
                    <span className="text-sm text-apple-ash">{row.amount}</span>
                    <span
                      className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        row.status === "Success"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-[rgb(var(--apple-snow))] text-apple-charcoal"
                      }`}
                    >
                      {row.status === "Success" && <Check size={11} />}
                      {row.status}
                    </span>
                    <span className="text-sm text-apple-smoke">
                      {row.method}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-apple-steel">
                  No saved payroll activity recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
