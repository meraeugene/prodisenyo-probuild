"use client";

import {
  Bar,
  CartesianGrid,
  Cell,
  BarChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartMoneyTooltip from "@/components/ChartMoneyTooltip";
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
    { name: "Collected", value: collected, color: "#076d69" },
    { name: "Outstanding", value: data.outstanding, color: "#69a99b" },
  ];

  return (
    <section aria-label="Portfolio insights" className="grid gap-3 xl:grid-cols-[1.35fr_.85fr]">
      <article className="min-w-0 rounded-xl border border-transparent bg-white p-5 shadow-workspace">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-slate-950">Contract vs Expenses Trend</h2>
            <div className="mt-3 flex flex-wrap gap-5 text-sm text-slate-600">
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#b8ded6]" />Contract Amount</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#076d69]" />Total Expenses</span>
            </div>
          </div>
          <select aria-label="Chart period" value={months} onChange={(event) => onMonthsChange(Number(event.target.value))} className="rounded-lg border border-transparent bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <option value={6}>Last 6 months</option><option value={12}>Last 12 months</option>
          </select>
        </div>
        <div className="mt-4 h-[300px]" aria-label="Monthly contract amounts and expenses">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.trend} accessibilityLayer margin={{ left: 0, right: 8, bottom: 8, top: 12 }} barGap={4}>
              <CartesianGrid vertical={false} stroke="#edf3f1"  />
              <XAxis dataKey="month" axisLine={false} tickLine={false} minTickGap={12} tick={{ fontSize: 13, fill: "#53736f" }} />
              <YAxis width={72} axisLine={false} tickLine={false} tickFormatter={formatCompactPeso} tick={{ fontSize: 13, fill: "#53736f" }} />
              <Tooltip content={<ChartMoneyTooltip formatValue={formatMoney} />} wrapperStyle={{ zIndex: 20 }} cursor={{ fill: "#f4faf7" }} />
              <Bar dataKey="contract" name="Contract Amount" fill="#b8ded6" radius={[5, 5, 0, 0]} maxBarSize={36} isAnimationActive={false} />
              <Bar dataKey="expenses" name="Total Expenses" fill="#076d69" radius={[5, 5, 0, 0]} maxBarSize={36} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="min-w-0 rounded-xl border border-transparent bg-white p-5 shadow-workspace">
        <h2 className="text-[18px] font-semibold tracking-tight text-slate-950">Collection Status</h2>
        <div className="mt-5 grid items-center gap-5 sm:grid-cols-[170px_minmax(0,1fr)] xl:grid-cols-[160px_minmax(0,1fr)]">
          <div className="relative h-40 w-40" role="img" aria-label={`${collectedPercent}% of the contract amount collected`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={data.contract ? collectionData : [{ name: "No contract", value: 1, color: "#e6f3ef" }]} dataKey="value" innerRadius={52} outerRadius={72} stroke="#fff" strokeWidth={2}>
                {(data.contract ? collectionData : [{ name: "No contract", color: "#e6f3ef" }]).map((item) => <Cell key={item.name} fill={item.color} />)}
              </Pie>{data.contract > 0 && <Tooltip content={<ChartMoneyTooltip formatValue={formatMoney} />} wrapperStyle={{ zIndex: 20 }} />}</PieChart>
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
