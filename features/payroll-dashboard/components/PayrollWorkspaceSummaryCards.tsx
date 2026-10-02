import { CircleCheckBig, FilePenLine, WalletCards } from "lucide-react";
import type { PayrollDashboardData } from "@/features/payroll-dashboard/types";
import { formatPayrollCurrency } from "@/features/payroll-dashboard/utils/payrollDashboard";

export default function PayrollWorkspaceSummaryCards({ data }: { data: PayrollDashboardData }) {
  const cards = [
    {
      label: "Active Payroll Drafts",
      value: data.workspaceRuns.filter((run) => run.status === "draft").length.toLocaleString("en-PH"),
      icon: FilePenLine,
      tone: "bg-sky-50 text-sky-700",
    },
    {
      label: "Total Approved Payroll",
      value: data.workspaceRuns.filter((run) => run.status === "approved").length.toLocaleString("en-PH"),
      icon: CircleCheckBig,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Approved Payroll Expenses",
      value: formatPayrollCurrency(data.summary.approvedNetPayroll),
      icon: WalletCards,
      tone: "bg-teal-50 text-teal-700",
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_26px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-950">{value}</p>
            </div>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={20} /></span>
          </div>
        </article>
      ))}
    </section>
  );
}
