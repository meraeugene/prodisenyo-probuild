"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { buildCeoPortfolio, formatCompactPeso } from "../utils/ceoPortfolio";
import { formatMoney } from "../utils/gmeaCalculations";

export default function CeoGmeaCharts({ data, count, months, onMonthsChange }: {
  data: ReturnType<typeof buildCeoPortfolio>; count: number; months: number; onMonthsChange: (months: number) => void;
}) {
  const panel = "min-w-0 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_-25px_rgba(15,23,42,.2)]";
  return (
    <section aria-label="Portfolio insights" className="grid gap-3 xl:grid-cols-[1.4fr_1fr_1fr]">
      <article className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-950">Contract vs. Expenses</h2>
          <select aria-label="Chart period" value={months} onChange={(event) => onMonthsChange(Number(event.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-600 focus-visible:outline-teal-700">
            <option value={6}>Last 6 months</option><option value={12}>Last 12 months</option>
          </select>
        </div>
        <div className="mt-3 flex gap-3 text-[10px] text-slate-500"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-teal-700" />Contract amount</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" />Expenses</span></div>
        <div className="mt-3 h-44" role="img" aria-label="Monthly contract amounts and expenses">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.trend} margin={{ left: 0, right: 0, bottom: 0, top: 5 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis width={48} axisLine={false} tickLine={false} tickFormatter={formatCompactPeso} tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip formatter={(value: number) => formatMoney(value)} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }} />
              <Bar dataKey="contract" name="Contract amount" fill="#087d76" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Bar dataKey="expenses" name="Expenses" fill="#d5dfe5" radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
      <article className={panel}>
        <h2 className="text-sm font-bold text-slate-950">Collection Status</h2>
        <div className="relative mx-auto mt-3 h-36 w-36" role="img" aria-label={`${count} projects by collection status`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={count ? data.statuses : [{ name: "No projects", value: 1, color: "#e2e8f0" }]} dataKey="value" innerRadius={48} outerRadius={67} stroke="none">
              {(count ? data.statuses : [{ name: "No projects", color: "#e2e8f0" }]).map((status) => <Cell key={status.name} fill={status.color} />)}
            </Pie></PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl tracking-tight text-slate-950">{count}</strong><span className="text-[10px] text-slate-500">Projects</span></div>
        </div>
        <ul className="mt-2 space-y-2">
          {data.statuses.map((status) => <li key={status.name} className="flex items-center gap-2 text-[11px] text-slate-500"><span className="h-2.5 w-2.5 rounded" style={{ backgroundColor: status.color }} /><span className="flex-1">{status.name}</span><strong className="font-medium text-slate-700">{status.value}</strong></li>)}
        </ul>
      </article>
      <article className={panel}>
        <h2 className="text-sm font-bold text-slate-950">Top Project Locations</h2>
        <div className="mt-6 space-y-5">
          {data.locations.slice(0, 5).map((location, index) => (
            <div key={location.name}>
              <div className="mb-2 flex items-start gap-3 text-[11px] text-slate-500"><span className="flex-1 break-words">{location.name}</span><strong className="text-slate-700">{location.count}</strong></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-50"><div className={`h-full rounded-full ${index === 0 ? "bg-teal-700" : "bg-slate-300"}`} style={{ width: `${location.count / Math.max(1, count) * 100}%` }} /></div>
            </div>
          ))}
          {!count && <p className="text-xs text-slate-400">Locations will appear when projects are added.</p>}
        </div>
      </article>
    </section>
  );
}
