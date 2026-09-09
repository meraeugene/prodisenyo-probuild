"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CeoDashboardProject } from "../types";
import { buildCeoDashboardCharts, formatCeoChartMoney, shortenCeoChartLabel } from "../utils/ceoDashboardCharts";
import { formatCeoCurrency } from "../utils/ceoDashboard";

const panelClass = "min-w-0 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_-25px_rgba(15,23,42,.2)]";

export default function CeoDashboardCharts({ projects }: { projects: CeoDashboardProject[] }) {
  const [sort, setSort] = useState("budget");
  const data = useMemo(() => buildCeoDashboardCharts(projects, sort), [projects, sort]);
  return (
    <section aria-label="Executive portfolio insights" className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <article className={panelClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-950">Budget vs. Actual Spend</h2>
          <select aria-label="Rank chart projects by" value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-600 outline-none focus-visible:ring-2 focus-visible:ring-teal-700">
            <option value="budget">Highest budget</option><option value="spent">Highest spend</option>
          </select>
        </div>
        <p className="mt-2 text-[10px] text-slate-400">Top six projects · current totals</p>
        <div className="mt-3 flex gap-4 text-[11px] text-slate-500"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-teal-700" />Budget</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-300" />Actual spend</span></div>
        {projects.length ? (
          <div className="mt-5 h-48" role="img" aria-label="Budget and actual spend for the top six projects">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.budgets} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickFormatter={shortenCeoChartLabel} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis tickFormatter={formatCeoChartMoney} width={50} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip formatter={(value: number) => formatCeoCurrency(value)} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }} />
                <Bar dataKey="budget" name="Budget" fill="#087d76" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="spent" name="Actual spend" fill="#d2dde4" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="py-16 text-center text-xs text-slate-400">Project budgets will appear here.</p>}
      </article>
      <article className={panelClass}>
        <h2 className="text-sm font-bold text-slate-950">Project Status</h2>
        <div className="relative mx-auto mt-3 h-40 w-40" role="img" aria-label={`${projects.length} projects by status`}>
          <ResponsiveContainer width="100%" height="100%"><PieChart>
            <Pie data={projects.length ? data.statuses : [{ name: "No projects", value: 1 }]} dataKey="value" innerRadius={53} outerRadius={73} stroke="none">
              {projects.length ? data.statuses.map((status) => <Cell key={status.key} fill={status.color} />) : <Cell fill="#e2e8f0" />}
            </Pie>
          </PieChart></ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-3xl tracking-tight text-slate-950">{projects.length}</strong><span className="mt-1 text-[10px] text-slate-500">Projects</span></div>
        </div>
        <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3">
          {data.statuses.map((status) => <li key={status.key} className="flex items-center gap-2 text-[11px] text-slate-500"><span className="h-2.5 w-2.5 shrink-0 rounded" style={{ backgroundColor: status.color }} /><span className="flex-1">{status.name}</span><strong className="text-slate-700">{status.value}</strong></li>)}
        </ul>
      </article>
      <article className={panelClass}>
        <h2 className="text-sm font-bold text-slate-950">Top Project Locations</h2>
        <div className="mt-6 space-y-5">
          {data.locations.map((location, index) => <div key={location.name}>
            <div className="mb-2 flex gap-3 text-[11px] text-slate-500"><span className="flex-1 break-words">{location.name}</span><strong className="text-slate-700">{location.count}</strong></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-50"><div className={`h-full rounded-full ${index === 0 ? "bg-teal-700" : "bg-slate-300"}`} style={{ width: `${location.count / Math.max(projects.length, 1) * 100}%` }} /></div>
          </div>)}
          {!projects.length && <p className="text-xs text-slate-400">Locations will appear when projects are added.</p>}
        </div>
      </article>
    </section>
  );
}
