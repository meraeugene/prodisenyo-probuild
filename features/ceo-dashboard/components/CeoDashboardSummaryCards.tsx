import {
  AlertTriangle,
  Boxes,
  BriefcaseBusiness,
  ClipboardCheck,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import type { CeoDashboardData } from "@/features/ceo-dashboard/types";
import {
  buildCeoAttentionItems,
  formatCeoCurrency,
  getCeoDashboardTotals,
} from "@/features/ceo-dashboard/utils/ceoDashboard";

type SummaryCard = {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
};

export default function CeoDashboardSummaryCards({ data }: { data: CeoDashboardData }) {
  const totals = getCeoDashboardTotals(data);
  const attentionCount = buildCeoAttentionItems(data.projects).length;
  const budgetPercent = totals.totalBudget
    ? Math.min(100, Math.round((totals.totalSpent / totals.totalBudget) * 100))
    : 0;
  const cards: SummaryCard[] = [
    { label: "Active projects", value: totals.activeProjects, helper: `${totals.completedProjects} completed`, icon: BriefcaseBusiness },
    { label: "Pending approvals", value: totals.pendingApprovals, helper: "Across approval workflows", icon: ClipboardCheck },
    { label: "Budget used", value: formatCeoCurrency(totals.totalSpent), helper: `${budgetPercent}% of ${formatCeoCurrency(totals.totalBudget)}`, icon: WalletCards },
    { label: "Material requests", value: data.materialRequests.length, helper: `${totals.materialApprovalCount} awaiting action`, icon: Boxes },
    { label: "Needs attention", value: attentionCount, helper: "Overdue or over budget", icon: AlertTriangle },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ label, value, helper, icon: Icon }) => (
        <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <Icon size={16} className="shrink-0 text-teal-700" />
          </div>
          <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-xs text-slate-500">{helper}</p>
          {label === "Budget used" ? (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-teal-700" style={{ width: `${budgetPercent}%` }} />
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}
