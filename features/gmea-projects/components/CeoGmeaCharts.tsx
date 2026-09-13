"use client";

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
import { buildCeoPortfolio, formatCompactPeso } from "../utils/ceoPortfolio";
import { formatMoney } from "../utils/gmeaCalculations";

export default function CeoGmeaCharts({ data, months, onMonthsChange }: {
  data: ReturnType<typeof buildCeoPortfolio>;
  count: number;
  months: number;
  onMonthsChange: (months: number) => void;
}) {
  const collected = Math.max(0, data.contract - data.outstanding);
  const collectedPercent = data.contract > 0 ? Math.round((collected / data.contract) * 100) : 0;
  const collectionData = [
    { name: "Collected", value: collected, color: "#159447" },
    { name: "Outstanding", value: data.outstanding, color: "#1673ea" },
  ];

  return (
    <section aria-label="Portfolio insights" className="grid gap-3 xl:grid-cols-[1.35fr_.85fr]">
      <article className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-950">Contract vs Expenses Trend</h2>
            <div className="mt-3 flex gap-5 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-blue-600" />Contract Amount</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-600" />Total Expenses</span>
            </div>
          </div>
          <select aria-label="Chart period" value={months} onChange={(event) => onMonthsChange(Number(event.target.value))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <option value={6}>Last 6 months</option><option value={12}>Last 12 months</option>
          </select>
        </div>
        <div className="mt-3 h-64" role="img" aria-label="Monthly contract amounts and expenses">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.trend} margin={{ left: 0, right: 8, bottom: 0, top: 8 }}>
              <CartesianGrid vertical={false} stroke="#dbe4ee" strokeDasharray="3 3" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis width={52} axisLine={false} tickLine={false} tickFormatter={formatCompactPeso} tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip formatter={(value: number) => formatMoney(value)} contentStyle={{ borderRadius: 10, borderColor: "#dbe4ee", boxShadow: "none", fontSize: 12 }} />
              <Bar dataKey="contract" name="Contract Amount" fill="#dbeafe" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Line type="monotone" dataKey="contract" name="Contract Amount" stroke="#2563eb" strokeWidth={2.2} dot={{ r: 3, fill: "#2563eb" }} />
              <Line type="monotone" dataKey="expenses" name="Total Expenses" stroke="#15803d" strokeWidth={2.2} dot={{ r: 3, fill: "#15803d" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold tracking-tight text-slate-950">Collection Status</h2>
        <div className="mt-5 grid items-center gap-5 sm:grid-cols-[170px_minmax(0,1fr)] xl:grid-cols-[160px_minmax(0,1fr)]">
          <div className="relative h-40 w-40" role="img" aria-label={`${collectedPercent}% of the contract amount collected`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={data.contract ? collectionData : [{ name: "No contract", value: 1, color: "#e2e8f0" }]} dataKey="value" innerRadius={52} outerRadius={72} stroke="#fff" strokeWidth={2}>
                {(data.contract ? collectionData : [{ name: "No contract", color: "#e2e8f0" }]).map((item) => <Cell key={item.name} fill={item.color} />)}
              </Pie></PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl tracking-tight text-slate-950">{collectedPercent}%</strong><span className="text-[10px] text-slate-500">Collected</span></div>
          </div>
          <div className="divide-y divide-slate-100">
            {collectionData.map((item) => {
              const percent = data.contract > 0 ? Math.round((item.value / data.contract) * 100) : 0;
              return <div key={item.name} className="grid grid-cols-[12px_1fr_auto_auto] items-center gap-3 py-3 text-xs"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-slate-600">{item.name}</span><strong className="text-slate-900 tabular-nums">{formatMoney(item.value)}</strong><span className="w-8 text-right text-slate-500">{percent}%</span></div>;
            })}
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 pt-4 text-xs"><span className="text-slate-500">Total Contract Amount</span><strong className="text-slate-900">{formatMoney(data.contract)}</strong><span className="w-8 text-right text-slate-500">100%</span></div>
          </div>
        </div>
      </article>
    </section>
  );
}
