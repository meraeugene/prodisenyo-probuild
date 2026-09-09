import Link from "next/link";
import CeoDashboardBanner from "./CeoDashboardBanner";
import CeoDashboardCharts from "./CeoDashboardCharts";
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
    <main className="min-h-full space-y-4 bg-[#f5f8f9] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <CeoDashboardBanner name={displayName} approvals={totals.pendingApprovals} href={reviewApprovalsHref} />

      <CeoDashboardSummaryCards data={data} />
      <CeoDashboardCharts projects={data.projects} />

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
