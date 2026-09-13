"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";
import type { PayrollRunRow } from "../types";
import { formatPayrollReportPeso } from "../utils/payrollReportHelpers";
import { buildPayrollApprovalAnalytics } from "../utils/payrollApprovalAnalytics";

export default function PayrollApprovalSummary({ reports }: { reports: PayrollRunRow[] }) {
  const pending = reports.filter((report) => report.status === "submitted");
  const approved = reports.filter((report) => report.status === "approved");
  const pendingValue = pending.reduce((sum, report) => sum + Number(report.net_total || 0), 0);
  const sites = new Set(reports.map((report) => report.site_name).filter(Boolean));
  const trend = buildPayrollApprovalAnalytics(reports).trend;
  const entries = [
    { label: "Pending Payrolls", value: pending.length, note: "Awaiting CEO review", color: "#1673ea", points: trend.map((item) => ({ value: item.net })) },
    { label: "Pending Value", value: formatPayrollReportPeso(pendingValue), note: "Net payroll for review", color: "#1673ea", points: trend.map((item) => ({ value: item.net })) },
    { label: "Approved Payrolls", value: approved.length, note: "Approved payroll runs", color: "#159447", points: trend.map((item) => ({ value: item.gross })) },
    { label: "Project Sites", value: sites.size, note: "With payroll records", color: "#1673ea", points: trend.map((item, index) => ({ value: item.net ? index + 1 : 0 })) },
  ];

  return (
    <section aria-label="Payroll approval summary" className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4">
      {entries.map((entry, index) => (
        <article key={entry.label} className={`min-w-0 px-5 py-4 ${index ? "border-t border-slate-200 sm:border-l xl:border-t-0" : ""}`}>
          <p className="truncate whitespace-nowrap text-xs font-semibold text-slate-700">{entry.label}</p>
          <p className="mt-1.5 truncate whitespace-nowrap text-[25px] font-bold leading-none tracking-[-0.035em] text-slate-950 tabular-nums">{entry.value}</p>
          <div className="mt-3 flex flex-nowrap items-end justify-between gap-2 overflow-hidden">
            <span className="shrink-0 whitespace-nowrap text-[10px] font-medium text-slate-500">{entry.note}</span>
            <div className="h-7 min-w-10 flex-1" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><LineChart data={entry.points.length ? entry.points : [{ value: 0 }]}><Line type="monotone" dataKey="value" stroke={entry.color} strokeWidth={1.8} dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>
          </div>
        </article>
      ))}
    </section>
  );
}
