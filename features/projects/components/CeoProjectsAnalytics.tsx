"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProjectRecord } from "../types";
import { buildCeoProjectsAnalytics } from "../utils/ceoProjectsAnalytics";
import {
  formatCompactProjectCurrency,
  formatProjectCurrency,
} from "../utils/projectPresentation";

function DonutPanel({ title, data, total }: { title: string; data: Array<{ name: string; value: number; color: string }>; total: number }) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-base font-bold tracking-tight text-slate-950">{title}</h2>
      <div className="mt-3 grid grid-cols-[135px_minmax(0,1fr)] items-center gap-4">
        <div className="relative h-32 w-32">
          <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={total ? data : [{ name: "Empty", value: 1, color: "#e2e8f0" }]} dataKey="value" innerRadius={43} outerRadius={59} stroke="#fff" strokeWidth={2}>{(total ? data : [{ name: "Empty", color: "#e2e8f0" }]).map((item) => <Cell key={item.name} fill={item.color} />)}</Pie></PieChart></ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-xl text-slate-950">{total}</strong><span className="text-[9px] text-slate-500">projects</span></div>
        </div>
        <div className="divide-y divide-slate-100">
          {data.map((item) => <div key={item.name} className="grid grid-cols-[10px_1fr_auto_auto] items-center gap-2 py-2 text-[11px]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} /><span className="truncate text-slate-600">{item.name}</span><strong className="text-slate-900">{item.value}</strong><span className="w-9 text-right text-slate-400">{total ? Math.round(item.value / total * 100) : 0}%</span></div>)}
        </div>
      </div>
    </article>
  );
}

export default function CeoProjectsAnalytics({ projects }: { projects: ProjectRecord[] }) {
  const [months, setMonths] = useState(6);
  const data = useMemo(() => buildCeoProjectsAnalytics(projects, months), [months, projects]);
  return (
    <section className="grid gap-3 xl:grid-cols-[1.4fr_.8fr]">
      <article className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-bold tracking-tight text-slate-950">Budget vs Actual Spend</h2><div className="mt-3 flex gap-5 text-[11px] text-slate-500"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-600" />Actual Spend</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-blue-600" />Budget</span></div></div><select value={months} onChange={(event) => setMonths(Number(event.target.value))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"><option value={6}>Last 6 months</option><option value={12}>Last 12 months</option></select></div>
        <div className="mt-3 h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.trend}><CartesianGrid vertical={false} stroke="#dbe4ee" strokeDasharray="3 3" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} /><YAxis width={58} axisLine={false} tickLine={false} tickFormatter={formatCompactProjectCurrency} tick={{ fontSize: 10, fill: "#64748b" }} /><Tooltip formatter={(value: number) => formatProjectCurrency(value)} /><Bar dataKey="budget" name="Budget" fill="#3b8ef7" radius={[3,3,0,0]} maxBarSize={30} /><Bar dataKey="spent" name="Actual Spend" fill="#28a56a" radius={[3,3,0,0]} maxBarSize={30} /></BarChart></ResponsiveContainer></div>
        <div className="grid border-t border-slate-100 pt-4 sm:grid-cols-3">{[[formatProjectCurrency(data.totalBudget), "Total Budget"], [formatProjectCurrency(data.totalSpent), "Actual Spend"], [`${data.overallProgress}%`, "Overall Progress"]].map(([value, label], index) => <div key={label} className={index ? "border-t border-slate-100 px-5 sm:border-l sm:border-t-0" : "px-1 sm:pr-5"}><strong className="text-lg text-slate-950">{value}</strong><p className="mt-1 text-[10px] text-slate-500">{label}</p></div>)}</div>
      </article>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1"><DonutPanel title="Project Status" data={data.statuses} total={projects.length} /><DonutPanel title="Delivery Risk" data={data.risks} total={projects.length} /></div>
    </section>
  );
}
