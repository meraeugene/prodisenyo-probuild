import CeoDashboardBanner from "./CeoDashboardBanner";
import CeoDashboardCharts from "./CeoDashboardCharts";
import CeoDashboardApprovalQueue from "@/features/ceo-dashboard/components/CeoDashboardApprovalQueue";
import CeoDashboardProjectsPanel from "@/features/ceo-dashboard/components/CeoDashboardProjectsPanel";
import CeoDashboardSummaryCards from "@/features/ceo-dashboard/components/CeoDashboardSummaryCards";
import CeoRecentProgressPanel from "@/features/ceo-dashboard/components/CeoRecentProgressPanel";
import type { CeoDashboardData } from "@/features/ceo-dashboard/types";
import styles from "./ceoDashboard.module.css";
import {
  buildCeoApprovalQueue,
  getCeoReviewApprovalsHref,
  getCeoDashboardTotals,
  formatCeoDate,
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
    <main className={styles.page}>
      <div className={styles.topbar}>
        <p><span className="font-medium text-[#076d69]">Prodisenyo</span><span aria-hidden="true" className="px-3 text-teal-200">/</span>Executive overview</p>
        <time dateTime={new Date().toISOString()}>{formatCeoDate(new Date().toISOString())}</time>
      </div>
      <CeoDashboardBanner name={displayName} approvals={totals.pendingApprovals} href={reviewApprovalsHref} />

      <div className="mt-6 space-y-5">
        <CeoDashboardSummaryCards data={data} />

        <div className={styles.performanceGrid}>
          <CeoDashboardCharts projects={data.projects} />
          <CeoDashboardApprovalQueue items={approvalQueue} />
        </div>

        <div className={styles.portfolioGrid}>
          <CeoDashboardProjectsPanel projects={data.projects} />
          <CeoRecentProgressPanel updates={data.progressUpdates} />
        </div>
      </div>
    </main>
  );
}
