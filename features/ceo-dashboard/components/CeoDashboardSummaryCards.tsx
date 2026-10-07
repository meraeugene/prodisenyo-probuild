import type { CeoDashboardData } from "../types";
import { formatCeoCompactCurrency, formatCeoCurrency, getCeoDashboardTotals } from "../utils/ceoDashboard";
import styles from "./ceoDashboard.module.css";

export default function CeoDashboardSummaryCards({ data }: { data: CeoDashboardData }) {
  const totals = getCeoDashboardTotals(data);
  const budgetPercent = totals.totalBudget ? Math.round(totals.totalSpent / totals.totalBudget * 100) : 0;
  const cards = [
    { label: "Active Projects", value: totals.activeProjects, note: `${totals.completedProjects} completed` },
    { label: "Pending Approvals", value: totals.pendingApprovals, note: "Awaiting review" },
    { label: "Budget Used", value: formatCeoCompactCurrency(totals.totalSpent), note: `${budgetPercent}% of ${formatCeoCompactCurrency(totals.totalBudget)}`, fullValue: formatCeoCurrency(totals.totalSpent) },
    { label: "Material Requests", value: data.materialRequests.length, note: `${totals.materialApprovalCount} awaiting review` },
  ];
  return (
    <section aria-label="Executive summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className={`${styles.panel} px-5 py-5`}>
          <h2 className="text-xs font-medium text-slate-500">{card.label}</h2>
          <p title={card.fullValue} className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.035em] text-slate-900 tabular-nums">{card.value}</p>
          <p className="mt-1.5 text-[13px] text-[#53736f]">{card.note}</p>
        </article>
      ))}
    </section>
  );
}
