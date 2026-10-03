import type { PayrollActivityItem } from "@/features/payroll-dashboard/types";
import { formatPayrollDateTime } from "@/features/payroll-dashboard/utils/payrollDashboard";

export default function PayrollRecentActivityPanel({
  items,
}: {
  items: PayrollActivityItem[];
}) {
  const visibleItems = items.slice(0, 5);

  return (
    <section className="rounded-2xl border border-transparent bg-white p-5 shadow-workspace">
      <h2 className="font-bold text-slate-950">Recent Activity</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Latest attendance and payroll updates
      </p>

      <div className="mt-4 divide-y divide-slate-100">
        {visibleItems.map((item) => {
          return (
            <article key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-bold leading-5 text-slate-900">
                    {item.title}
                  </p>
                  <time className="shrink-0 text-[10px] text-slate-400">
                    {formatPayrollDateTime(item.createdAt)}
                  </time>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  {item.detail}
                </p>
                <p className="mt-1 text-[10px] font-medium text-slate-400">
                  {item.actor}
                </p>
              </div>
            </article>
          );
        })}
        {!visibleItems.length ? (
          <div className="rounded-xl bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-slate-800">No payroll activity yet</p>
            <p className="mt-1 text-xs text-slate-500">Saved workflow events will appear here.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
