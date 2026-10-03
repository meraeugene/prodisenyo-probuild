"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GmeaOverviewDivisionFinance } from "../types";
import { FINANCE_CHART_COLORS, formatCompactOverviewMoney } from "../utils/gmeaFinanceCharts";
import { formatOverviewMoney } from "../utils/gmeaOverviewSelectors";
import GmeaFinanceDivisionTick from "./GmeaFinanceDivisionTick";
import GmeaFinanceTooltip from "./GmeaFinanceTooltip";

export default function FinancialSnapshotChart({ divisions }: { divisions: GmeaOverviewDivisionFinance[] }) {
  const hasActivity = divisions.some(({ revenue, expenses }) => revenue !== 0 || expenses !== 0);

  return (
    <article aria-labelledby="financial-snapshot-title" className="min-w-0 rounded-[20px] border border-transparent bg-white p-5 shadow-workspace sm:p-6">
      <h2 id="financial-snapshot-title" className="text-xl font-bold tracking-tight text-slate-950">Financial Snapshot</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">Compare revenue and expenses across both divisions.</p>
      <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold text-slate-600">
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#076d69]" />Revenue</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#b8ded6]" />Expenses</span>
      </div>

      <div className="mt-4 h-[280px] w-full sm:h-[300px]" aria-label="Revenue and expenses comparison chart">
        {hasActivity ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={divisions} accessibilityLayer margin={{ top: 12, right: 8, bottom: 12, left: 0 }} barGap={8} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke="#e6f3ef" strokeDasharray="0" />
              <XAxis dataKey="name" tick={<GmeaFinanceDivisionTick />} height={54} interval={0} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCompactOverviewMoney} domain={["auto", "auto"]} tick={{ fill: "#53736f", fontSize: 14 }} width={72} axisLine={false} tickLine={false} tickCount={5} />
              <ReferenceLine y={0} stroke="#a0cbbf" ifOverflow="extendDomain" />
              <Tooltip content={<GmeaFinanceTooltip />} cursor={{ fill: "#f4faf7", radius: 8 }} />
              <Bar dataKey="revenue" name="Revenue" fill={FINANCE_CHART_COLORS.revenue} radius={[6, 6, 0, 0]} maxBarSize={56} isAnimationActive={false} />
              <Bar dataKey="expenses" name="Expenses" fill={FINANCE_CHART_COLORS.expenses} radius={[6, 6, 0, 0]} maxBarSize={56} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center rounded-2xl bg-slate-50 px-6 text-center text-base text-slate-500">Revenue and expenses will appear here once financial activity is recorded.</div>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {divisions.map((division) => (
          <div key={division.name} className="workspace-surface p-4">
            <h3 className="text-sm font-semibold text-slate-800">{division.name}</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"><dt className="text-slate-500">Revenue</dt><dd className="font-semibold tabular-nums text-[#076d69]">{formatOverviewMoney(division.revenue)}</dd></div>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"><dt className="text-slate-500">Expenses</dt><dd className="font-semibold tabular-nums text-[#53736f]">{formatOverviewMoney(division.expenses)}</dd></div>
            </dl>
          </div>
        ))}
      </div>
    </article>
  );
}
