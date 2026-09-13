"use client";

import { ArrowDownRight, ArrowUpRight, Clock3, TriangleAlert } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import type { CeoDashboardData } from "@/features/ceo-dashboard/types";
import {
  buildCeoAttentionItems,
  formatCeoCurrency,
  getCeoDashboardTotals,
} from "@/features/ceo-dashboard/utils/ceoDashboard";

const SPARKLINES = {
  green: [2, 4, 3, 5, 5, 7, 6, 9],
  blue: [7, 5, 6, 4, 6, 3, 6, 4],
  red: [3, 5, 4, 6, 5, 7, 7, 9],
};

export default function CeoDashboardSummaryCards({ data }: { data: CeoDashboardData }) {
  const totals = getCeoDashboardTotals(data);
  const attentionCount = buildCeoAttentionItems(data.projects).length;
  const budgetPercent = totals.totalBudget
    ? Math.round((totals.totalSpent / totals.totalBudget) * 100)
    : 0;
  const cards = [
    {
      label: "Active Projects",
      value: totals.activeProjects,
      note: `${totals.completedProjects} completed`,
      noteColor: "text-emerald-700",
      line: "#16a34a",
      points: SPARKLINES.green,
      icon: ArrowUpRight,
    },
    {
      label: "Pending Approvals",
      value: totals.pendingApprovals,
      note: "Awaiting review",
      noteColor: "text-rose-600",
      line: "#2563eb",
      points: SPARKLINES.green,
      icon: Clock3,
    },
    {
      label: "Budget Used",
      value: formatCeoCurrency(totals.totalSpent),
      note: `${budgetPercent}% of ${formatCeoCurrency(totals.totalBudget)}`,
      noteColor: "text-emerald-700",
      line: "#16a34a",
      points: SPARKLINES.green,
      icon: ArrowUpRight,
    },
    {
      label: "Material Requests",
      value: data.materialRequests.length,
      note: `${totals.materialApprovalCount} awaiting review`,
      noteColor: "text-emerald-700",
      line: "#2563eb",
      points: SPARKLINES.blue,
      icon: ArrowDownRight,
    },
    {
      label: "Critical Issues",
      value: attentionCount,
      note: "Requires attention",
      noteColor: "text-rose-600",
      line: "#ef3340",
      points: SPARKLINES.red,
      icon: TriangleAlert,
    },
  ];

  return (
    <section
      aria-label="Executive summary"
      className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-5"
    >
      {cards.map((card, index) => {
        const NoteIcon = card.icon;
        return (
          <article
            key={card.label}
            className={`relative min-w-0 px-5 py-4 ${index ? "border-t border-slate-200 sm:border-l xl:border-t-0" : ""}`}
          >
            <p className="truncate whitespace-nowrap text-xs font-semibold text-slate-700">{card.label}</p>
            <p className="mt-1.5 truncate whitespace-nowrap text-[25px] font-bold leading-none tracking-[-0.035em] text-slate-950 tabular-nums">
              {card.value}
            </p>
            <div className="mt-3 flex flex-nowrap items-end justify-between gap-2 overflow-hidden">
              <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[10px] font-semibold ${card.noteColor}`}>
                <NoteIcon size={12} strokeWidth={2.2} aria-hidden="true" />
                <span className="whitespace-nowrap">{card.note}</span>
              </span>
              <div className="h-7 min-w-8 max-w-16 flex-1" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={card.points.map((value) => ({ value }))}>
                    <Line type="monotone" dataKey="value" stroke={card.line} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
