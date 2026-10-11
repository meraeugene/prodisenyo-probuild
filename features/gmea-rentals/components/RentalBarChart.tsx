"use client";

import { useId } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_TOOLTIP_STYLE } from "@/lib/chartTheme";
import { formatRentalMoney } from "../utils/rentalUi";
import type { RentalChartPoint } from "../utils/rentalChartSelectors";

export type RentalChartSeries = { key: string; label: string; color: string };
export default function RentalBarChart({ title, description, data, series, money = true }: {
  title: string; description: string; data: RentalChartPoint[]; series: RentalChartSeries[]; money?: boolean;
}) {
  const id = useId();
  const hasData = data.some(point => series.some(item => Number(point[item.key]) !== 0));
  const formatValue = (value: number) => money ? formatRentalMoney(value) : value.toLocaleString("en-PH");
  return <figure aria-labelledby={id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
    <figcaption><h3 id={id} className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></figcaption>
    {hasData ? <>
      <div aria-hidden="true" className="mt-4 h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} minTickGap={12} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} width={64} allowDecimals={money}
              tickFormatter={value => money ? "₱" + Intl.NumberFormat("en-PH", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value)) : String(value)} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: "#f1f5f9" }}
              formatter={(value, name) => [formatValue(Number(value)), name]} />
            {series.map(item => <Bar key={item.key} dataKey={item.key} name={item.label} fill={item.color} stackId="total" maxBarSize={40} isAnimationActive={false} />)}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div aria-hidden="true" className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
        {series.map(item => <span key={item.key} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />{item.label}</span>)}
      </div>
      <details className="mt-3 text-xs text-slate-600"><summary className="cursor-pointer rounded py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700">View chart data</summary>
        <div className="mt-2 overflow-x-auto"><table className="w-full text-left"><caption className="sr-only">{title}</caption>
          <thead><tr><th scope="col" className="py-2 pr-3">Period</th>{series.map(item => <th scope="col" className="px-2 py-2 text-right" key={item.key}>{item.label}</th>)}</tr></thead>
          <tbody>{data.map((point, index) => <tr key={index} className="border-t border-slate-100"><th scope="row" className="py-2 pr-3 font-normal">{point.label}</th>
            {series.map(item => <td key={item.key} className="px-2 py-2 text-right tabular-nums">{formatValue(Number(point[item.key]))}</td>)}</tr>)}</tbody>
        </table></div>
      </details>
    </> : <p role="status" className="flex min-h-[240px] items-center justify-center text-center text-sm text-slate-500">No activity for this period and these filters.</p>}
  </figure>;
}
