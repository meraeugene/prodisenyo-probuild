"use client";

import { Eye, Trash2 } from "lucide-react";
import EstimateStatusBadge from "@/features/cost-estimator/components/EstimateStatusBadge";
import {
  formatEstimateDateTime,
  formatBudgetMoney,
  formatProjectTypeLabel,
} from "@/features/cost-estimator/utils/costEstimatorFormatters";
import type { ReviewProjectEstimateRow } from "@/features/cost-estimator/types";

export default function EstimateReviewsTable({
  estimates,
  pendingReviewsCount,
  onOpenReport,
  onDeleteEstimate,
}: {
  estimates: ReviewProjectEstimateRow[];
  pendingReviewsCount: number;
  onOpenReport: (estimateId: string) => void;
  onDeleteEstimate: (estimateId: string) => void;
}) {
  return (
    <section className="mt-4 rounded-[18px] border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.06)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
            Review Queue
          </p>
          <h2 className="mt-2 text-xl font-semibold text-apple-charcoal">
            Submitted And Reviewed Estimates
          </h2>
        </div>
        <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          {pendingReviewsCount} pending
        </span>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-apple-mist">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[rgb(var(--apple-snow))]">
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">
                Project
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">
                Type
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">
                Submitted
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">
                Submitted By
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">
                Total
              </th>
              <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">
                Status
              </th>
              <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-apple-mist">
            {estimates.length > 0 ? (
              estimates.map((estimate) => (
                <tr key={estimate.id}>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-apple-charcoal">
                      {estimate.project_name}
                    </p>
                    <p className="mt-1 text-xs text-apple-steel">
                      Engineer estimate
                    </p>
                  </td>
                  <td className="px-3 py-3 text-apple-smoke">
                    {formatProjectTypeLabel(estimate.project_type)}
                  </td>
                  <td className="px-3 py-3 text-apple-smoke">
                    {formatEstimateDateTime(estimate.submitted_at ?? estimate.created_at)}
                  </td>
                  <td className="px-3 py-3 text-apple-smoke">
                    {estimate.requester_profile?.full_name?.trim() ||
                      estimate.requester_profile?.username ||
                      "Unknown engineer"}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-apple-charcoal">
                    {formatBudgetMoney(estimate.estimate_total)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <EstimateStatusBadge status={estimate.status} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenReport(estimate.id)}
                        className="inline-flex h-9 items-center gap-1 rounded-lg border border-apple-mist px-3 text-xs font-semibold text-apple-charcoal transition hover:border-emerald-200 hover:bg-emerald-50"
                      >
                        <Eye size={13} />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEstimate(estimate.id)}
                        className="inline-flex h-9 items-center gap-1 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-3 py-5 text-center text-sm text-apple-steel">
                  No submitted estimates are waiting for review.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
