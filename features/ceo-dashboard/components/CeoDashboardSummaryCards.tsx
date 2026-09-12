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
    <section aria-label="Executive summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {cards.map(({ label, value, helper, icon: Icon, accent }) => (
        <article key={label} className="relative min-h-36 min-w-0 overflow-hidden rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,.055)]">
          <div className="relative z-10 flex min-w-0 items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${accent}`}>
              <Icon size={26} strokeWidth={1.9} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-1 text-4xl font-semibold tracking-[-0.045em] text-slate-950 tabular-nums">{value}</p>
              <p className="mt-1 text-xs text-slate-400">{helper}</p>
            </div>
          </div>
          {label === "Budget used" ? (
            <div className="relative z-10 mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-teal-700" style={{ width: `${budgetPercent}%` }} />
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}
