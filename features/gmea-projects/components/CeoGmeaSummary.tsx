"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";
import { formatMoney } from "../utils/gmeaCalculations";
import type { buildCeoPortfolio } from "../utils/ceoPortfolio";

type PortfolioTrend = ReturnType<typeof buildCeoPortfolio>["trend"];

export default function CeoGmeaSummary({ count, contract, expenses, outstanding, trend }: {
  count: number;
  contract: number;
  expenses: number;
  outstanding: number;
  trend: PortfolioTrend;
}) {
  const expensePercent = contract > 0 ? Math.round((expenses / contract) * 100) : 0;
  const outstandingPercent = contract > 0 ? Math.round((outstanding / contract) * 100) : 0;
  const entries = [
    { label: "Projects", value: String(count), note: "Current portfolio", color: "#15803d", points: trend.map((_, index) => ({ value: Math.min(count, index + 1) })) },
    { label: "Contract Amount", value: formatMoney(contract), note: "Total portfolio value", color: "#2563eb", points: trend.map((item) => ({ value: item.contract })) },
    { label: "Total Expenses", value: formatMoney(expenses), note: `${expensePercent}% of contract value`, color: "#15803d", points: trend.map((item) => ({ value: item.expenses })) },
    { label: "Outstanding Collections", value: formatMoney(outstanding), note: `${outstandingPercent}% of contract value`, color: "#2563eb", points: trend.map((item) => ({ value: Math.max(0, item.contract - item.expenses) })) },
  ];

  return (
    <section aria-label="GMEA portfolio summary" className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4">
      {entries.map((entry, index) => (
        <article key={entry.label} className={`min-w-0 px-5 py-4 ${index ? "border-t border-slate-200 sm:border-l xl:border-t-0" : ""}`}>
          <p className="truncate whitespace-nowrap text-xs font-semibold text-slate-700">{entry.label}</p>
          <p className="mt-1.5 truncate whitespace-nowrap text-[25px] font-bold leading-none tracking-[-0.035em] text-slate-950 tabular-nums">{entry.value}</p>
          <div className="mt-3 flex flex-nowrap items-end justify-between gap-2 overflow-hidden">
            <span className="shrink-0 whitespace-nowrap text-[10px] font-medium text-slate-500">{entry.note}</span>
            <div className="h-7 min-w-10 flex-1" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={entry.points.length ? entry.points : [{ value: 0 }]}>
                  <Line type="monotone" dataKey="value" stroke={entry.color} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
