"use client";

import { useMemo, useState } from "react";
import { CHART_TOOLTIP_STYLE } from "@/lib/chartTheme";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PayrollRunRow } from "../types";
import { formatPayrollReportPeso } from "../utils/payrollReportHelpers";
import { buildPayrollApprovalAnalytics } from "../utils/payrollApprovalAnalytics";

export default function PayrollApprovalAnalytics({ reports }: { reports: PayrollRunRow[] }) {
  const [months, setMonths] = useState(6);
  const data = useMemo(() => buildPayrollApprovalAnalytics(reports, months), [months, reports]);
  const maxSiteValue = Math.max(...data.sites.map((site) => site.value), 1);

  return (
    <section className="grid gap-3 xl:grid-cols-[1.35fr_.85fr]">
      <article className="min-w-0 overflow-hidden rounded-xl border border-transparent bg-white p-5 shadow-workspace">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-[17px] font-semibold tracking-tight text-slate-950">Payroll Value Trend</h2><div className="mt-3 flex gap-5 text-[11px] text-slate-500"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#b8ded6]" />Gross Payroll</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#076d69]" />Net Payroll</span></div></div><select value={months} onChange={(event) => setMonths(Number(event.target.value))} className="rounded-lg border border-transparent bg-white px-3 py-2 text-xs text-slate-700"><option value={6}>Last 6 months</option><option value={12}>Last 12 months</option></select></div>
        <div className="mt-3 h-56"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.trend}><CartesianGrid vertical={false} stroke="#edf3f1"  /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#53736f" }} /><YAxis width={58} axisLine={false} tickLine={false} tickFormatter={(value) => new Intl.NumberFormat("en-PH", { notation: "compact", maximumFractionDigits: 1 }).format(value)} tick={{ fontSize: 10, fill: "#53736f" }} /><Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => formatPayrollReportPeso(value)} /><Bar dataKey="gross" name="Gross Payroll" fill="#b8ded6" radius={[4,4,0,0]} maxBarSize={34} /><Line type="monotone" dataKey="net" name="Net Payroll" stroke="#076d69" strokeWidth={2.2} dot={{ r: 3, fill: "#076d69" }} /></ComposedChart></ResponsiveContainer></div>
        <div className="grid border-t border-slate-100 pt-4 sm:grid-cols-3">{[[formatPayrollReportPeso(data.totalGross), "Total Gross Payroll"], [formatPayrollReportPeso(data.totalNet), "Total Net Payroll"], [String(data.sites.length), "Project Sites"]].map(([value, label], index) => <div key={label} className={index ? "border-t border-slate-100 px-5 sm:border-l sm:border-t-0" : "px-1 sm:pr-5"}><strong className="text-lg text-slate-950">{value}</strong><p className="mt-1 text-[10px] text-slate-500">{label}</p></div>)}</div>
      </article>
      <div className="grid gap-3">
        <article className="rounded-xl border border-transparent bg-white p-4 shadow-workspace"><h2 className="text-[17px] font-semibold text-slate-950">Payroll Status</h2><div className="mt-3 grid grid-cols-[135px_minmax(0,1fr)] items-center gap-4"><div className="relative h-32 w-32"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={reports.length ? data.statuses : [{ name: "Empty", value: 1, color: "#e6f3ef" }]} dataKey="value" innerRadius={43} outerRadius={59} stroke="#fff" strokeWidth={2}>{(reports.length ? data.statuses : [{ name: "Empty", color: "#e6f3ef" }]).map((item) => <Cell key={item.name} fill={item.color} />)}</Pie></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-xl text-slate-950">{reports.length}</strong><span className="text-[9px] text-slate-500">payroll runs</span></div></div><div className="divide-y divide-slate-100">{data.statuses.map((item) => <div key={item.name} className="grid grid-cols-[10px_1fr_auto_auto] items-center gap-2 py-2 text-[11px]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-slate-600">{item.name}</span><strong>{item.value}</strong><span className="w-9 text-right text-slate-400">{reports.length ? Math.round(item.value / reports.length * 100) : 0}%</span></div>)}</div></div></article>
        <article className="rounded-xl border border-transparent bg-white p-4 shadow-workspace"><div className="mb-3 flex justify-between"><h2 className="text-sm font-bold text-slate-950">Payroll by Project Site</h2><span className="text-[10px] text-slate-400">Total Payroll</span></div><div className="space-y-2">{data.sites.slice(0, 6).map((site) => <div key={site.name} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-[10px]"><span className="truncate text-slate-600">{site.name}</span><div className="h-1.5 overflow-hidden rounded-full bg-[#eaf4f0]"><div className="h-full rounded-full bg-[#69a99b]" style={{ width: `${site.value / maxSiteValue * 100}%` }} /></div><strong className="text-slate-800">{formatPayrollReportPeso(site.value)}</strong></div>)}</div></article>
      </div>
    </section>
  );
}
