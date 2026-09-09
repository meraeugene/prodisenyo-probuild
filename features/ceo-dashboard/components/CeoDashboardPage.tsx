import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CeoAttentionPanel from "@/features/ceo-dashboard/components/CeoAttentionPanel";
import CeoBudgetSnapshot from "@/features/ceo-dashboard/components/CeoBudgetSnapshot";
import CeoDashboardApprovalQueue from "@/features/ceo-dashboard/components/CeoDashboardApprovalQueue";
import CeoDashboardProjectsPanel from "@/features/ceo-dashboard/components/CeoDashboardProjectsPanel";
import CeoDashboardSummaryCards from "@/features/ceo-dashboard/components/CeoDashboardSummaryCards";
import CeoMaterialWorkflowPanel from "@/features/ceo-dashboard/components/CeoMaterialWorkflowPanel";
import CeoRecentActivityPanel from "@/features/ceo-dashboard/components/CeoRecentActivityPanel";
import CeoRecentProgressPanel from "@/features/ceo-dashboard/components/CeoRecentProgressPanel";
import type { CeoDashboardData } from "@/features/ceo-dashboard/types";
import {
  buildCeoApprovalQueue,
  buildCeoAttentionItems,
  buildCeoRecentActivity,
  getCeoReviewApprovalsHref,
  getCeoDashboardTotals,
} from "@/features/ceo-dashboard/utils/ceoDashboard";

export default function CeoDashboardPage({
  data,
  fullName,
}: {
  data: CeoDashboardData;
  fullName: string | null;
}) {
  const displayName = fullName?.trim() || "CEO";
  const totals = getCeoDashboardTotals(data);
  const approvalQueue = buildCeoApprovalQueue(data);
  const reviewApprovalsHref = getCeoReviewApprovalsHref(approvalQueue);
  const attentionItems = buildCeoAttentionItems(data.projects);
  const recentActivity = buildCeoRecentActivity(data);

  return (
    <main className="min-h-full bg-[#f6f9f9] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="relative mb-6 overflow-hidden rounded-3xl bg-[#075e5b] px-5 py-6 text-white shadow-[0_18px_40px_-24px_rgba(7,94,91,.75)] sm:px-7 sm:py-7">
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-teal-50">
              Dashboard
            </div>
            <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Good day, {displayName}</h1>
            <p className="mt-2 max-w-xl text-sm text-teal-50/80">
              One clear view of delivery, spend, and decisions across your business.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <Link
              href={reviewApprovalsHref}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-teal-800 shadow-sm transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-teal-800"
            >
              Review approvals
              {totals.pendingApprovals > 0 ? (
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] text-teal-900">
                  {totals.pendingApprovals}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      <CeoDashboardSummaryCards data={data} />

      <div className="mt-5">
        <CeoDashboardProjectsPanel projects={data.projects} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <CeoDashboardApprovalQueue items={approvalQueue} />
        <CeoRecentProgressPanel updates={data.progressUpdates} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,.72fr)_minmax(280px,.72fr)]">
        <CeoBudgetSnapshot
          totalBudget={totals.totalBudget}
          estimatedCost={totals.estimatedCost}
          totalSpent={totals.totalSpent}
        />
        <CeoMaterialWorkflowPanel requests={data.materialRequests} />
        <CeoAttentionPanel items={attentionItems} />
      </div>

      <div className="mt-5">
        <CeoRecentActivityPanel items={recentActivity} />
      </div>

      <div className="mt-5 flex justify-end">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-800 hover:text-teal-950">
          Open project portfolio <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  );
}
