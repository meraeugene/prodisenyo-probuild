"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardPageHero from "@/components/DashboardPageHero";
import CostEstimatorConfirmModal from "@/features/cost-estimator/components/CostEstimatorConfirmModal";
import EstimateReportModal from "@/features/cost-estimator/components/EstimateReportModal";
import EstimateReviewsSectionSkeleton from "@/features/cost-estimator/components/EstimateReviewsSectionSkeleton";
import EstimateReviewsTable from "@/features/cost-estimator/components/EstimateReviewsTable";
import { useEstimateReviewsPage } from "@/features/cost-estimator/hooks/useEstimateReviewsPage";
import type {
  ProjectEstimateItemRow,
  ReviewProjectEstimateRow,
} from "@/features/cost-estimator/types";

export default function EstimateReviewsPageClient({
  estimates,
  items,
}: {
  estimates: ReviewProjectEstimateRow[];
  items: ProjectEstimateItemRow[];
}) {
  const router = useRouter();
  const state = useEstimateReviewsPage({ estimates, items });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isRefreshing) return;
    const timeout = window.setTimeout(() => setIsRefreshing(false), 600);
    return () => window.clearTimeout(timeout);
  }, [isRefreshing]);

  return (
    <div className="p-6">
      <DashboardPageHero
        eyebrow="CEO Review"
        title="Estimate Reviews"
        description="Review engineer-submitted project estimates before bidding and push approved totals into Budget Tracker as new projects."
        actions={
          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              router.refresh();
            }}
            disabled={isRefreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[rgb(var(--theme-chart-5))] px-4 text-sm font-semibold text-[rgb(var(--apple-black))] transition hover:bg-[rgb(var(--apple-silver))] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            Sync
          </button>
        }
      />

      {isRefreshing ? (
        <EstimateReviewsSectionSkeleton />
      ) : (
        <EstimateReviewsTable
          estimates={state.sortedEstimates}
          pendingReviewsCount={state.pendingReviewsCount}
          onOpenReport={state.setActiveEstimateId}
          onDeleteEstimate={state.setDeleteEstimateId}
        />
      )}

      {state.activeEstimate ? (
        <EstimateReportModal
          estimate={state.activeEstimate}
          items={state.activeEstimateItems}
          onClose={() => state.setActiveEstimateId(null)}
          footer={
            state.activeEstimate.status === "submitted" ? (
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => state.setRejectEstimateId(state.activeEstimate!.id)}
                  disabled={state.isPending}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {state.isPending && state.pendingActionType === "reject" ? (
                    <>
                      <LoaderCircle size={15} className="mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    "Reject Estimate"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => state.handleApproveEstimate(state.activeEstimate!.id)}
                  disabled={state.isPending}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#1f6a37] px-4 text-sm font-semibold text-white transition hover:bg-[#18552d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {state.isPending && state.pendingActionType === "approve" ? (
                    <>
                      <LoaderCircle size={15} className="mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    "Approve Estimate"
                  )}
                </button>
              </div>
            ) : null
          }
        />
      ) : null}

      {state.rejectEstimateId ? (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[24px] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.24)]">
            <div className="border-b border-apple-mist bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] px-5 py-4 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
                Reject Estimate
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                Send this estimate back to the engineer
              </h2>
            </div>

            <div className="space-y-4 px-5 py-5">
              <textarea
                value={state.rejectionReason}
                onChange={(event) => state.setRejectionReason(event.target.value)}
                rows={5}
                placeholder="Add an optional rejection reason for the engineer."
                className="w-full rounded-2xl border border-apple-mist px-3 py-3 text-sm text-apple-charcoal outline-none transition focus:border-[#1f6a37]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    state.setRejectEstimateId(null);
                    state.setRejectionReason("");
                  }}
                  disabled={state.isPending}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-apple-mist px-4 text-sm font-semibold text-apple-charcoal transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={state.handleConfirmReject}
                  disabled={state.isPending}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {state.isPending ? (
                    <>
                      <LoaderCircle size={15} className="mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    "Confirm Reject"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <CostEstimatorConfirmModal
        open={state.deleteEstimateId !== null}
        title="Delete estimate?"
        description="This will permanently remove the selected estimate from the review list."
        confirmLabel="Delete estimate"
        confirmTone="danger"
        pending={state.isPending && state.deleteEstimateId !== null}
        onConfirm={state.handleConfirmDelete}
        onCancel={() => state.setDeleteEstimateId(null)}
      />
    </div>
  );
}
