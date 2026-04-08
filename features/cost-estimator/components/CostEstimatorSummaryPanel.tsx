"use client";

import EstimateStatusBadge from "@/features/cost-estimator/components/EstimateStatusBadge";
import { formatBudgetMoney } from "@/features/cost-estimator/utils/costEstimatorFormatters";
import type { ProjectEstimateRow } from "@/features/cost-estimator/types";

export default function CostEstimatorSummaryPanel({
  estimate,
  costEstimate,
  itemCount,
  totalQuantity,
}: {
  estimate: ProjectEstimateRow | null;
  costEstimate: number;
  itemCount: number;
  totalQuantity: number;
}) {
  return (
    <aside className="min-h-full border-l border-apple-mist bg-white px-5 py-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-apple-charcoal">
          Summary
        </h2>
        {estimate ? <EstimateStatusBadge status={estimate.status} /> : null}
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <p className="text-sm text-apple-steel">Cost estimate</p>
          <p className="mt-2 text-[20px] font-semibold text-apple-charcoal">
            {formatBudgetMoney(costEstimate)}
          </p>
        </div>

        <div>
          <p className="text-sm text-apple-steel">Cost items</p>
          <p className="mt-2 text-[20px] font-semibold text-apple-charcoal">
            {itemCount.toLocaleString("en-PH")}
          </p>
        </div>

        <div>
          <p className="text-sm text-apple-steel">Total quantity</p>
          <p className="mt-2 text-[20px] font-semibold text-apple-charcoal">
            {totalQuantity.toLocaleString("en-PH", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="rounded-[16px] border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-sm leading-6 text-emerald-900">
            {itemCount > 0
              ? "Line totals update this cost estimate automatically."
              : "Add your first cost item to start building the estimate breakdown."}
          </p>
        </div>
      </div>
    </aside>
  );
}
