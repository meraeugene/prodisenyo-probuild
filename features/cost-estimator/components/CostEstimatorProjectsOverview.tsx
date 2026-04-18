"use client";

import { FolderOpen, PlusCircle } from "lucide-react";
import DashboardPageHero from "@/components/DashboardPageHero";
import EstimateStatusBadge from "@/features/cost-estimator/components/EstimateStatusBadge";
import {
  formatBudgetMoney,
  formatProjectTypeLabel,
} from "@/features/cost-estimator/utils/costEstimatorFormatters";
import type {
  ProjectEstimateItemRow,
  ProjectEstimateRow,
} from "@/features/cost-estimator/types";

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function CostEstimatorProjectsOverview({
  estimates,
  itemsByEstimateId,
  pending,
  onOpenProject,
  onCreateProject,
}: {
  estimates: ProjectEstimateRow[];
  itemsByEstimateId: Record<string, ProjectEstimateItemRow[]>;
  pending: boolean;
  onOpenProject: (estimateId: string) => void;
  onCreateProject: () => void;
}) {
  return (
    <div className="space-y-4 p-0 sm:p-6">
      <DashboardPageHero
        eyebrow="Cost Estimation Workflow"
        title="Overall Projects"
        description="Select a project to open its estimate board, or create a new one for another client request."
        actions={
          <button
            type="button"
            onClick={onCreateProject}
            disabled={pending}
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0"
          >
            <PlusCircle size={14} />
            New project
          </button>
        }
      />

      <section className="rounded-none border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.06)] sm:rounded-[18px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
              Project Queue
            </p>
            <h2 className="mt-2 text-xl font-semibold text-apple-charcoal">
              Your Estimates
            </h2>
          </div>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {estimates.length} project{estimates.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {estimates.map((estimate) => {
            const estimateItems = itemsByEstimateId[estimate.id] ?? [];
            const totalQuantity = estimateItems.reduce(
              (sum, item) => sum + (item.quantity ?? 0),
              0,
            );
            const totalItemCost = estimateItems.reduce(
              (sum, item) => sum + (item.line_total ?? 0),
              0,
            );

            return (
              <article
                key={estimate.id}
                className="rounded-[14px] border border-apple-mist bg-[rgb(var(--apple-snow))] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
                      {formatProjectTypeLabel(estimate.project_type)}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-apple-charcoal">
                      {estimate.project_name}
                    </h3>
                  </div>
                  <EstimateStatusBadge status={estimate.status} />
                </div>

                <div className="mt-4 space-y-2 text-sm text-apple-smoke">
                  <p>
                    Total estimate:{" "}
                    <span className="font-semibold text-green-700">
                      {formatBudgetMoney(estimate.estimate_total)}
                    </span>
                  </p>

                  <p>
                    Total quantity:{" "}
                    <span className="font-semibold text-sky-700">
                      {totalQuantity.toLocaleString("en-PH")}
                    </span>
                  </p>
                  <p>
                    Total item cost:{" "}
                    <span className="font-semibold text-amber-700">
                      {formatBudgetMoney(totalItemCost)}
                    </span>
                  </p>

                  <p>
                    Updated:{" "}
                    <span className="font-semibold text-apple-charcoal">
                      {formatUpdatedAt(estimate.updated_at)}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenProject(estimate.id)}
                  disabled={pending}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-[#1f6a37] px-4 text-sm font-semibold text-white transition hover:bg-[#18552d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FolderOpen size={15} />
                  Open project
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
