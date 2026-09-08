import {
  CalendarDays,
  ClipboardClock,
  FileCheck2,
  WalletCards,
} from "lucide-react";
import type { PayrollDashboardSummary } from "@/features/payroll-dashboard/types";
import { formatPayrollCurrency } from "@/features/payroll-dashboard/utils/payrollDashboard";

export default function PayrollDashboardSummaryCards({
  summary,
}: {
  summary: PayrollDashboardSummary;
}) {
  const cards = [
    {
      label: "Attendance Batches",
      value: summary.attendanceBatches.toLocaleString("en-PH"),
      icon: CalendarDays,
    },
    {
      label: "Payroll to Process",
      value: summary.readyForPayroll.toLocaleString("en-PH"),
      icon: ClipboardClock,
    },
    {
      label: "Pending CEO Approval",
      value: summary.awaitingCeo.toLocaleString("en-PH"),
      icon: FileCheck2,
    },
    {
      label: "Approved Payroll",
      value: formatPayrollCurrency(summary.approvedNetPayroll),
      icon: WalletCards,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.035)]"
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700"
              >
                <Icon size={21} strokeWidth={1.8} />
              </div>
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
