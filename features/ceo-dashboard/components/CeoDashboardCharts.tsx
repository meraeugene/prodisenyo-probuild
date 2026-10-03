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
import styles from "./ceoDashboard.module.css";
import { formatCeoCompactCurrency, formatCeoCurrency } from "../utils/ceoDashboard";
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
    <section className={styles.panel}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-2 pt-4">
        <div>
          <h2 className={styles.heading}>Spend &amp; Progress Trend</h2>
          <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-[#53736f]">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#076d69]" />Actual Spend</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#67aaa4]" />Project Progress</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#c4e9e4]" />Planned Budget</span>
          </div>
        </div>
        <select
          aria-label="Chart range"
          value={range}
          onChange={(event) => setRange(event.target.value)}
          className="rounded-lg border border-teal-900/10 bg-white px-3 py-2 text-xs font-medium text-[#294b48] outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
        >
          <option value="portfolio">All projects</option>
          <option value="top">Top four</option>
        </select>
      </div>

      {chartData.length ? (
        <div className="h-64 px-2 pt-2" role="img" aria-label="Project spending, budgets, and progress">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#edf3f1" strokeDasharray="0" />
              <XAxis dataKey="name" tickFormatter={shortenCeoChartLabel} axisLine={false} tickLine={false} tick={{ fill: "#53736f", fontSize: 10 }} />
              <YAxis yAxisId="money" tickFormatter={formatCeoChartMoney} width={58} axisLine={false} tickLine={false} tick={{ fill: "#53736f", fontSize: 10 }} />
              <YAxis yAxisId="progress" orientation="right" domain={[0, 100]} tickFormatter={(value) => `${value}%`} width={38} axisLine={false} tickLine={false} tick={{ fill: "#53736f", fontSize: 10 }} />
              <Tooltip formatter={(value: number, name: string) => name === "Progress" ? `${value}%` : formatCeoCurrency(value)} contentStyle={{ borderRadius: 10, borderColor: "#e5f0ed", boxShadow: "0 2px 12px rgba(24,55,52,.04)", fontSize: 12 }} />
              <Bar yAxisId="money" dataKey="budget" name="Planned Budget" fill="#c4e9e4" radius={[4, 4, 0, 0]} maxBarSize={34} />
              <Line yAxisId="money" type="monotone" dataKey="spent" name="Actual Spend" stroke="#076d69" strokeWidth={2.25} dot={{ r: 3, fill: "#076d69" }} />
              <Line yAxisId="progress" type="monotone" dataKey="progress" name="Progress" stroke="#67aaa4" strokeWidth={2.25} dot={{ r: 3, fill: "#67aaa4" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-24 text-center text-sm text-[#53736f]">Project performance will appear here.</p>
      )}

      <div className="grid border-t border-teal-900/[0.06] bg-white sm:grid-cols-3">
        {[
          [formatCeoCompactCurrency(totalBudget), "Total Budget"],
          [formatCeoCompactCurrency(totalSpent), "Actual Spend"],
          [`${overallProgress}%`, "Overall Progress"],
        ].map(([value, label], index) => (
          <div key={label} className={`px-5 py-3 ${index ? "border-t border-teal-900/[0.06] sm:border-l sm:border-t-0" : ""}`}>
            <p className="text-lg font-semibold tracking-tight text-[#1d1d1f] tabular-nums">{value}</p>
            <p className="mt-0.5 text-[11px] text-[#53736f]">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
