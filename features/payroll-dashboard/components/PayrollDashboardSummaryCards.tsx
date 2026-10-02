import type {
  PayrollDashboardData,
  PayrollDashboardSummary,
} from "@/features/payroll-dashboard/types";
import { formatPayrollCurrency } from "@/features/payroll-dashboard/utils/payrollDashboard";

export default function PayrollDashboardSummaryCards({
  data,
}: {
  data: PayrollDashboardData;
}) {
  const summary: PayrollDashboardSummary = data.summary;
  const cards = [
    {
      label: "Payroll Drafts",
      value: data.workspaceRuns
        .filter((run) => run.status === "draft")
        .length.toLocaleString("en-PH"),
    },
    {
      label: "Payroll to Process",
      value: summary.readyForPayroll.toLocaleString("en-PH"),
    },
    {
      label: "Pending CEO Approval",
      value: summary.awaitingCeo.toLocaleString("en-PH"),
    },
    {
      label: "Approved Payroll Expenses",
      value: formatPayrollCurrency(summary.approvedNetPayroll),
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        return (
          <article
            key={card.label}
            className="rounded-[22px] border border-white/80 bg-white/80 p-4 shadow-[0_14px_38px_rgba(15,23,42,0.06)] backdrop-blur-xl"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  {card.label}
                </p>
                <p className="mt-1 truncate text-xl font-bold tracking-[-0.03em] text-slate-950">
                  {card.value}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
