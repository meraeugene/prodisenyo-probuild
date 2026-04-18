"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import EstimateStatusBadge from "@/features/cost-estimator/components/EstimateStatusBadge";
import {
  formatEstimateDateTime,
  formatBudgetMoney,
  formatProjectTypeLabel,
} from "@/features/cost-estimator/utils/costEstimatorFormatters";
import type {
  ProjectEstimateItemRow,
  ProjectEstimateRow,
  ReviewProjectEstimateRow,
} from "@/features/cost-estimator/types";

type EstimateReportEstimate = ProjectEstimateRow & {
  requester_profile?: ReviewProjectEstimateRow["requester_profile"];
};

export default function EstimateReportModal({
  estimate,
  items,
  onClose,
  footer,
}: {
  estimate: EstimateReportEstimate;
  items: ProjectEstimateItemRow[];
  onClose: () => void;
  footer?: ReactNode;
}) {
  const overallTotal = items.reduce(
    (sum, item) => sum + (item.line_total ?? 0),
    0,
  );
  const remainingBudget = estimate.estimate_total - overallTotal;
  const budgetSummary =
    remainingBudget > 0
      ? {
          label: "Budget Status",
          message: `${formatBudgetMoney(
            remainingBudget,
          )} still remaining before reaching the estimate target.`,
          className: "border-emerald-100 bg-emerald-50 text-emerald-900",
        }
      : remainingBudget < 0
        ? {
            label: "Budget Status",
            message: `${formatBudgetMoney(
              Math.abs(remainingBudget),
            )} over the estimate target.`,
            className: "border-rose-200 bg-rose-50 text-rose-900",
          }
        : {
            label: "Budget Status",
            message: "Current item costs match the estimate target.",
            className: "border-sky-200 bg-sky-50 text-sky-900",
          };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-0 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-[100dvh] w-full max-w-none flex-col overflow-x-hidden overflow-y-hidden rounded-none bg-[#f6faf7] shadow-[0_28px_80px_rgba(15,23,42,0.24)] sm:h-auto sm:max-h-[96vh] sm:max-w-[1380px] sm:rounded-[28px]">
        <div className="border-b border-emerald-950/10 bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] text-white sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                Estimate Report
              </p>
              <h2 className="mt-2 truncate text-2xl font-semibold tracking-[-0.03em]">
                {estimate.project_name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close estimate report"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="grid gap-5 xl:grid-cols-[1fr_1.08fr]">
            <section className="min-w-0 rounded-[22px] border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.06)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
                    Project Summary
                  </p>
                  <h3 className="mt-2 truncate text-lg font-semibold text-apple-charcoal">
                    {estimate.project_name}
                  </h3>
                </div>
                <EstimateStatusBadge status={estimate.status} />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
                    Project Type
                  </p>
                  <p className="mt-1 text-sm font-semibold text-apple-charcoal">
                    {formatProjectTypeLabel(estimate.project_type)}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
                    Total Estimate
                  </p>
                  <p className="mt-1 text-sm font-semibold text-apple-charcoal">
                    {formatBudgetMoney(estimate.estimate_total)}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
                    Submitted
                  </p>
                  <p className="mt-1 text-sm font-semibold text-apple-charcoal">
                    {formatEstimateDateTime(estimate.submitted_at)}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
                    Submitted By
                  </p>
                  <p className="mt-1 text-sm font-semibold text-apple-charcoal">
                    {estimate.requester_profile?.full_name?.trim() ||
                      estimate.requester_profile?.username ||
                      "Unknown engineer"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-apple-mist px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
                  Notes
                </p>
                <p className="mt-2 text-sm leading-6 text-apple-charcoal">
                  {estimate.notes?.trim() || "No notes added."}
                </p>
              </div>

              <div
                className={`mt-4 rounded-2xl border px-4 py-3 ${budgetSummary.className}`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                  {budgetSummary.label}
                </p>
                <p className="mt-2 text-sm font-medium leading-6">
                  {budgetSummary.message}
                </p>
              </div>

              {estimate.status === "rejected" ? (
                <div className="mt-4 rounded-2xl border border-[#dceadb] bg-[#f5faf6] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5b7d63]">
                    Review Notes
                  </p>
                  <p className="mt-2 text-sm leading-6 text-apple-charcoal">
                    {estimate.rejection_reason?.trim() ||
                      "No additional notes were provided for this revision request."}
                  </p>
                </div>
              ) : null}
            </section>

            <section className="min-w-0 rounded-[22px] border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
                    Line Items
                  </p>
                  <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-apple-charcoal">
                    {items.length} item{items.length === 1 ? "" : "s"}
                  </h3>
                </div>
                <p className="text-2xl font-semibold tracking-[-0.03em] text-apple-charcoal">
                  {formatBudgetMoney(estimate.estimate_total)}
                </p>
              </div>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-apple-mist">
                <table className="min-w-[640px] w-full text-sm">
                  <thead>
                    <tr className="bg-[rgb(var(--apple-snow))]">
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">
                        Item
                      </th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">
                        Material
                      </th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">
                        Qty
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">
                        Unit Cost
                      </th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-apple-mist">
                    {items.length > 0 ? (
                      <>
                        {items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-3 align-top">
                              <p className="font-semibold text-apple-charcoal">
                                {item.item_name_snapshot}
                              </p>
                              {item.notes ? (
                                <p className="mt-2 text-xs text-apple-smoke">
                                  {item.notes}
                                </p>
                              ) : null}
                            </td>
                            <td className="px-3 py-3 align-top text-apple-smoke">
                              <p className="font-medium text-apple-charcoal">
                                {item.material_name_snapshot ||
                                  item.item_name_snapshot}
                              </p>
                              <p className="mt-1 text-xs text-apple-steel">
                                {item.unit_label_snapshot}
                              </p>
                            </td>
                            <td className="px-3 py-3 text-right align-top text-apple-smoke">
                              {item.quantity.toLocaleString("en-PH", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-right align-top text-apple-smoke">
                              {formatBudgetMoney(item.unit_cost_snapshot)}
                            </td>
                            <td className="px-3 py-3 text-right align-top font-semibold text-apple-charcoal">
                              {formatBudgetMoney(item.line_total)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-[#f5faf6]">
                          <td
                            colSpan={4}
                            className="px-3 py-3 text-right text-sm font-semibold uppercase tracking-[0.12em] text-[#345344]"
                          >
                            Item Cost Total
                          </td>
                          <td className="px-3 py-3 text-right text-base font-semibold text-[#2d6a4f]">
                            {formatBudgetMoney(overallTotal)}
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-5 text-center text-sm text-apple-steel"
                        >
                          No estimate items were saved.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        {footer ? (
          <div className="border-t border-apple-mist bg-white px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-6 sm:py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
