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
  accent: string;
};

export default function CeoDashboardSummaryCards({ data }: { data: CeoDashboardData }) {
  const totals = getCeoDashboardTotals(data);
  const attentionCount = buildCeoAttentionItems(data.projects).length;
  const budgetPercent = totals.totalBudget
    ? Math.min(100, Math.round((totals.totalSpent / totals.totalBudget) * 100))
    : 0;
  const cards: SummaryCard[] = [
    { label: "Active projects", value: totals.activeProjects, helper: `${totals.completedProjects} completed`, icon: BriefcaseBusiness, accent: "bg-teal-50 text-teal-700" },
    { label: "Pending approvals", value: totals.pendingApprovals, helper: "Across approval workflows", icon: ClipboardCheck, accent: "bg-amber-50 text-amber-700" },
    { label: "Budget used", value: formatCeoCurrency(totals.totalSpent), helper: `${budgetPercent}% of ${formatCeoCurrency(totals.totalBudget)}`, icon: WalletCards, accent: "bg-sky-50 text-sky-700" },
    { label: "Material requests", value: data.materialRequests.length, helper: `${totals.materialApprovalCount} awaiting action`, icon: Boxes, accent: "bg-violet-50 text-violet-700" },
    { label: "Needs attention", value: attentionCount, helper: "Overdue or over budget", icon: AlertTriangle, accent: "bg-rose-50 text-rose-700" },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ label, value, helper, icon: Icon, accent }) => (
        <article key={label} className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_-20px_rgba(15,23,42,.6)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <span className={`grid h-8 w-8 place-items-center rounded-lg ${accent}`}>
              <Icon size={16} className="shrink-0" />
            </span>
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
