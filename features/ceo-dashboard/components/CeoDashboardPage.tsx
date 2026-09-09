import Link from "next/link";
import CeoDashboardBanner from "./CeoDashboardBanner";
import CeoDashboardCharts from "./CeoDashboardCharts";
import { ArrowRight } from "lucide-react";
import CeoBudgetSnapshot from "@/features/ceo-dashboard/components/CeoBudgetSnapshot";
import CeoDashboardProjectsPanel from "@/features/ceo-dashboard/components/CeoDashboardProjectsPanel";
import CeoDashboardSummaryCards from "@/features/ceo-dashboard/components/CeoDashboardSummaryCards";
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
    <main className="min-h-full space-y-4 bg-white px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <CeoDashboardBanner name={displayName} approvals={totals.pendingApprovals} href={reviewApprovalsHref} />

      <CeoDashboardSummaryCards data={data} />
      <CeoDashboardCharts projects={data.projects} />

      <div className="mt-5">
        <CeoDashboardProjectsPanel projects={data.projects} />
      </div>

      <div className="mt-6">
        <CeoBudgetSnapshot
          totalBudget={totals.totalBudget}
          estimatedCost={totals.estimatedCost}
          totalSpent={totals.totalSpent}
        />
      </div>

      <div className="mt-5 flex justify-end">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-800 hover:text-teal-950">
          Open project portfolio <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  );
}
