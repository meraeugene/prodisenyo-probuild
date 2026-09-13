import CeoDashboardBanner from "./CeoDashboardBanner";
import CeoDashboardCharts from "./CeoDashboardCharts";
import CeoDashboardApprovalQueue from "@/features/ceo-dashboard/components/CeoDashboardApprovalQueue";
import CeoDashboardProjectsPanel from "@/features/ceo-dashboard/components/CeoDashboardProjectsPanel";
import CeoDashboardSummaryCards from "@/features/ceo-dashboard/components/CeoDashboardSummaryCards";
import CeoRecentProgressPanel from "@/features/ceo-dashboard/components/CeoRecentProgressPanel";
import type { CeoDashboardData } from "@/features/ceo-dashboard/types";
import {
  buildCeoApprovalQueue,
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

  return (
    <main className="min-h-full bg-slate-50/40 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <CeoDashboardBanner name={displayName} approvals={totals.pendingApprovals} href={reviewApprovalsHref} />

      <div className="mt-4 space-y-4">
        <CeoDashboardSummaryCards data={data} />

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,.95fr)]">
          <CeoDashboardCharts projects={data.projects} />
          <CeoDashboardApprovalQueue items={approvalQueue} />
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,.65fr)]">
          <CeoDashboardProjectsPanel projects={data.projects} />
          <CeoRecentProgressPanel updates={data.progressUpdates} />
        </div>
      </div>
    </main>
  );
}
