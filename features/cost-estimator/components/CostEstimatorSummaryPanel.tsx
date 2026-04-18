"use client";

import Image from "next/image";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import EstimateStatusBadge from "@/features/cost-estimator/components/EstimateStatusBadge";
import { formatBudgetMoney } from "@/features/cost-estimator/utils/costEstimatorFormatters";
import type { ProjectEstimateRow } from "@/features/cost-estimator/types";

export default function CostEstimatorSummaryPanel({
  estimate,
  costEstimate,
  currentItemTotal,
  itemCount,
  totalQuantity,
}: {
  estimate: ProjectEstimateRow | null;
  costEstimate: number;
  currentItemTotal: number;
  itemCount: number;
  totalQuantity: number;
}) {
  const variance = Math.round((costEstimate - currentItemTotal) * 100) / 100;
  const budgetState =
    itemCount === 0
      ? "empty"
      : variance > 0
        ? "under"
        : variance < 0
          ? "over"
          : "even";
  const messageConfig =
    budgetState === "empty"
      ? {
          wrapperClassName: "border-emerald-100 bg-emerald-50",
          textClassName: "text-emerald-900",
          message:
            "Add your first cost item to start building the estimate breakdown.",
        }
      : budgetState === "under"
        ? {
            wrapperClassName: "border-emerald-100 bg-emerald-50",
            textClassName: "text-emerald-900",
            message: `${formatBudgetMoney(variance)} remaining before you reach the estimate target.`,
          }
        : budgetState === "over"
          ? {
              icon: AlertTriangle,
              wrapperClassName: "border-rose-100 bg-rose-50",
              textClassName: "text-rose-900",
              message: `${formatBudgetMoney(Math.abs(variance))} above the estimate target.`,
            }
          : {
              icon: CheckCircle2,
              wrapperClassName: "border-sky-100 bg-sky-50",
              textClassName: "text-sky-900",
              message: "Current item costs match the estimate target.",
            };

  return (
    <aside className="min-h-full border-t border-apple-mist bg-white px-5 py-6 xl:border-t-0 xl:border-l">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-apple-charcoal">
          Summary
        </h2>
        {estimate ? <EstimateStatusBadge status={estimate.status} /> : null}
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <p className="text-sm text-apple-steel">Cost estimate</p>
          <p className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-apple-charcoal">
            {formatBudgetMoney(costEstimate)}
          </p>
        </div>

        <div>
          <p className="text-sm text-apple-steel">Item cost total</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#2d6a4f]">
            {formatBudgetMoney(currentItemTotal)}
          </p>
        </div>

        <div>
          <p className="text-sm text-apple-steel">Total quantity</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-emerald-600">
            {totalQuantity.toLocaleString("en-PH", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div
          className={`rounded-[16px] border px-4 py-4 transition-colors ${messageConfig.wrapperClassName}`}
        >
          <p className={`text-sm leading-7 ${messageConfig.textClassName}`}>
            {messageConfig.message}
          </p>
        </div>

        {estimate?.status === "rejected" ? (
          <div className="overflow-hidden rounded-[20px] border border-[#dceadb] bg-[linear-gradient(180deg,#fcfffd_0%,#f4f9f5_100%)] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="relative hidden h-[88px] w-[88px] shrink-0 sm:block">
                <Image
                  src="/estimate-rejection-robot.png"
                  alt="Friendly robot assistant"
                  fill
                  priority
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5b7d63]">
                  Estimate Update Needed
                </p>
                <p className="mt-2 text-sm leading-7 text-apple-charcoal">
                  {estimate.rejection_reason?.trim() ||
                    "This estimate needs a few updates before approval. Review the notes and update the project when ready."}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
