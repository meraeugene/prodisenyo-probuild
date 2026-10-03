"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GmeaOverviewDivisionFinance } from "../types";
import { FINANCE_CHART_COLORS, formatCompactOverviewMoney } from "../utils/gmeaFinanceCharts";
import { formatOverviewMoney } from "../utils/gmeaOverviewSelectors";
import GmeaFinanceDivisionTick from "./GmeaFinanceDivisionTick";
import GmeaFinanceTooltip from "./GmeaFinanceTooltip";

export default function ProfitBreakdownChart({ divisions }: { divisions: GmeaOverviewDivisionFinance[] }) {
  const totalProfit = divisions.reduce((total, division) => total + division.profit, 0);
  const hasProfit = divisions.some(({ profit }) => profit !== 0);

  return (
    <article aria-labelledby="profit-breakdown-title" className="min-w-0 rounded-[20px] border border-transparent bg-white p-5 shadow-workspace sm:p-6">
      <h2 id="profit-breakdown-title" className="text-xl font-bold tracking-tight text-slate-950">Profit Breakdown</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">Net profit by division after expenses.</p>
      <div className="mt-5 rounded-2xl bg-teal-50 px-4 py-3">
        <p className="text-sm font-medium text-slate-600">Total net profit</p>
        <p className={`mt-1 break-words text-2xl font-bold tracking-tight tabular-nums sm:text-3xl ${totalProfit < 0 ? "text-rose-700" : "text-teal-800"}`}>{formatOverviewMoney(totalProfit)}</p>
      </div>

      <div className="mt-4 h-[230px] w-full sm:h-[250px]" aria-label="Net profit comparison chart">
        {hasProfit ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={divisions} accessibilityLayer margin={{ top: 12, right: 8, bottom: 12, left: 0 }} barCategoryGap="32%">
              <CartesianGrid vertical={false} stroke="#e6f3ef" strokeDasharray="0" />
              <XAxis dataKey="name" tick={<GmeaFinanceDivisionTick />} height={54} interval={0} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCompactOverviewMoney} domain={["auto", "auto"]} tick={{ fill: "#53736f", fontSize: 14 }} width={72} axisLine={false} tickLine={false} tickCount={5} />
              <ReferenceLine y={0} stroke="#a0cbbf" ifOverflow="extendDomain" />
              <Tooltip content={<GmeaFinanceTooltip />} cursor={{ fill: "#f4faf7", radius: 8 }} />
              <Bar dataKey="profit" name="Net profit" radius={[6, 6, 0, 0]} maxBarSize={72} isAnimationActive={false}>
                {divisions.map((division) => <Cell key={division.name} fill={division.profit < 0 ? FINANCE_CHART_COLORS.loss : FINANCE_CHART_COLORS.profit} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center rounded-2xl bg-slate-50 px-6 text-center text-base text-slate-500">Net profit is zero for both divisions.</div>
        )}
      </div>

      <dl className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
        {divisions.map((division) => (
          <div key={division.name} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3">
            <dt className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"><span className={`h-3 w-3 rounded ${division.profit < 0 ? "bg-rose-600" : "bg-teal-600"}`} />{division.name}</dt>
            <dd className={`text-[17px] font-semibold tabular-nums ${division.profit < 0 ? "text-rose-700" : "text-slate-900"}`}>{formatOverviewMoney(division.profit)}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
