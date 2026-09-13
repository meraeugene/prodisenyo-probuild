"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CeoDashboardProject } from "../types";
import { formatCeoCurrency } from "../utils/ceoDashboard";
import { formatCeoChartMoney, shortenCeoChartLabel } from "../utils/ceoDashboardCharts";

export default function CeoDashboardCharts({ projects }: { projects: CeoDashboardProject[] }) {
  const [range, setRange] = useState("portfolio");
  const chartData = useMemo(
    () =>
      [...projects]
        .sort((left, right) => right.budget - left.budget)
        .slice(0, range === "portfolio" ? 6 : 4)
        .map((project) => ({
          name: project.name,
          budget: project.budget,
          spent: project.spent,
          progress: project.progress,
        })),
    [projects, range],
  );
  const totalBudget = projects.reduce((sum, project) => sum + project.budget, 0);
  const totalSpent = projects.reduce((sum, project) => sum + project.spent, 0);
  const overallProgress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length)
    : 0;

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-2 pt-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-950">Spend &amp; Progress Trend</h2>
          <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-600" />Actual Spend</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-blue-600" />Planned Budget</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-blue-100" />Project Progress</span>
          </div>
        </div>
        <select
          aria-label="Chart range"
          value={range}
          onChange={(event) => setRange(event.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <option value="portfolio">All projects</option>
          <option value="top">Top four</option>
        </select>
      </div>

      {chartData.length ? (
        <div className="h-64 px-2 pt-2" role="img" aria-label="Project spending, budgets, and progress">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e8eef5" strokeDasharray="3 3" />
              <XAxis dataKey="name" tickFormatter={shortenCeoChartLabel} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis yAxisId="money" tickFormatter={formatCeoChartMoney} width={58} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis yAxisId="progress" orientation="right" domain={[0, 100]} tickFormatter={(value) => `${value}%`} width={38} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip formatter={(value: number, name: string) => name === "Progress" ? `${value}%` : formatCeoCurrency(value)} contentStyle={{ borderRadius: 10, borderColor: "#dbe4ee", boxShadow: "none", fontSize: 12 }} />
              <Bar yAxisId="money" dataKey="budget" name="Planned Budget" fill="#dbeafe" radius={[4, 4, 0, 0]} maxBarSize={34} />
              <Line yAxisId="money" type="monotone" dataKey="spent" name="Actual Spend" stroke="#15803d" strokeWidth={2.25} dot={{ r: 3, fill: "#15803d" }} />
              <Line yAxisId="progress" type="monotone" dataKey="progress" name="Progress" stroke="#2563eb" strokeWidth={2.25} dot={{ r: 3, fill: "#2563eb" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-24 text-center text-sm text-slate-500">Project performance will appear here.</p>
      )}

      <div className="grid border-t border-slate-100 bg-slate-50/40 sm:grid-cols-3">
        {[
          [formatCeoCurrency(totalBudget), "Total Budget"],
          [formatCeoCurrency(totalSpent), "Actual Spend"],
          [`${overallProgress}%`, "Overall Progress"],
        ].map(([value, label], index) => (
          <div key={label} className={`px-5 py-3 ${index ? "border-t border-slate-100 sm:border-l sm:border-t-0" : ""}`}>
            <p className="text-lg font-bold tracking-tight text-slate-950 tabular-nums">{value}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
