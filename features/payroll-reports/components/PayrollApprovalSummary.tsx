import { Banknote, Building2, CheckCircle2, FileClock } from "lucide-react";
import type { PayrollRunRow } from "../types";
import { formatPayrollReportPeso } from "../utils/payrollReportHelpers";

export default function PayrollApprovalSummary({
  reports,
}: {
  reports: PayrollRunRow[];
}) {
  const pending = reports.filter((report) => report.status === "submitted");
  const approved = reports.filter((report) => report.status === "approved");
  const pendingValue = pending.reduce(
    (total, report) => total + Number(report.net_total || 0),
    0,
  );
  const sites = new Set(reports.map((report) => report.site_name).filter(Boolean));
  const cards = [
    {
      label: "Pending payrolls",
      value: pending.length,
      helper: "Waiting for a CEO decision",
      icon: FileClock,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Pending value",
      value: formatPayrollReportPeso(pendingValue),
      helper: "Combined net payroll for review",
      icon: Banknote,
      tone: "bg-teal-50 text-teal-700",
    },
    {
      label: "Approved payrolls",
      value: approved.length,
      helper: "Visible in the current archive",
      icon: CheckCircle2,
      tone: "bg-sky-50 text-sky-700",
    },
    {
      label: "Project sites",
      value: sites.size,
      helper: "Represented in payroll reports",
      icon: Building2,
      tone: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <section
      aria-label="Payroll approval summary"
      className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4"
    >
      {cards.map(({ label, value, helper, icon: Icon, tone }) => (
        <article
          key={label}
          className="flex min-w-0 items-start gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_-25px_rgba(15,23,42,.25)]"
        >
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
            <Icon size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xs font-medium text-slate-500">{label}</h2>
            <p className="mt-1.5 break-words text-2xl font-bold tracking-tight text-slate-950 tabular-nums">
              {value}
            </p>
            <p className="mt-1 text-[10px] leading-4 text-slate-400">{helper}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
