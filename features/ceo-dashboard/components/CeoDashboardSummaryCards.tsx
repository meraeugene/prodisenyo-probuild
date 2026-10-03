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
          <p title={card.fullValue} className="text-[30px] font-semibold leading-none tracking-[-0.035em] text-[#1d1d1f] tabular-nums">{card.value}</p>
          <h2 className="mt-2 text-[15px] font-medium text-[#294b48]">{card.label}</h2>
          <p className="mt-1.5 text-[13px] text-[#53736f]">{card.note}</p>
        </article>
      ))}
    </section>
  );
}
