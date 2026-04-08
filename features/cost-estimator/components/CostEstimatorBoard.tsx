"use client";

import { formatBudgetMoney } from "@/features/cost-estimator/utils/costEstimatorFormatters";
import type { ProjectEstimateDraftForm, ProjectEstimateRow } from "@/features/cost-estimator/types";

export default function CostEstimatorBoard({
  estimate,
  form,
  readOnly,
  onAddCost,
  onEditItem,
}: {
  estimate: ProjectEstimateRow | null;
  form: ProjectEstimateDraftForm;
  readOnly: boolean;
  onAddCost: () => void;
  onEditItem: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-apple-charcoal">
              Estimate Items
            </h2>
          </div>
          <p className="mt-2 text-sm text-apple-smoke">
            {form.items.length} item{form.items.length === 1 ? "" : "s"} |{" "}
            {formatBudgetMoney(
              form.items.reduce((sum, item) => sum + item.lineTotal, 0) ||
                estimate?.estimate_total ||
                form.costEstimate,
            )}
          </p>
        </div>
      </div>

      <div className="min-h-[520px] rounded-[14px] border border-apple-mist bg-[rgb(var(--apple-snow))] p-3">
        {form.items.length === 0 ? (
          <div className="flex min-h-[470px] items-center justify-center rounded-[12px] px-6 text-center text-sm leading-8 text-apple-steel">
            Add costs you expect for this project estimate.
          </div>
        ) : (
          <div className="space-y-3">
            {form.items.map((item, index) => (
              <button
                key={`${item.catalogItemId}-${index}`}
                type="button"
                onClick={() => {
                  if (!readOnly) {
                    onEditItem(index);
                  }
                }}
                className="w-full rounded-[12px] border border-apple-mist bg-white p-4 text-left shadow-[0_8px_20px_rgba(24,83,43,0.06)] transition hover:border-[#1f6a37]/35 hover:bg-[#fbfefc]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[17px] font-semibold tracking-[-0.02em] text-apple-charcoal">
                      {item.displayName}
                    </p>
                    <p className="mt-2 text-xs font-medium uppercase tracking-[0.22em] text-apple-steel">
                      {item.materialName} | {item.unitType}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Qty {item.quantity}
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between text-apple-smoke">
                    <span>Unit cost</span>
                    <span className="font-semibold text-apple-charcoal">
                      {formatBudgetMoney(item.unitCost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-apple-smoke">
                    <span>Quantity</span>
                    <span className="font-semibold text-apple-charcoal">
                      {item.quantity.toLocaleString("en-PH", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-apple-mist pt-3">
                    <span className="text-apple-smoke">Total estimate</span>
                    <span className="font-semibold text-[#1f6a37]">
                      {formatBudgetMoney(item.lineTotal)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
