"use client";

import {
  CheckCircle2,
  FolderPlus,
  LoaderCircle,
  Save,
  Trash2,
} from "lucide-react";
import EstimateStatusBadge from "@/features/cost-estimator/components/EstimateStatusBadge";
import type { ProjectEstimateRow } from "@/features/cost-estimator/types";
import { cn } from "@/lib/utils";

export default function CostEstimatorHeader({
  estimates,
  selectedEstimate,
  uiLocked,
  pendingDeleteEstimate,
  pendingSaveEstimate,
  saveState,
  saveMessage,
  onSelectEstimate,
  onSaveDraft,
  onNewProject,
  onDeleteProject,
}: {
  estimates: ProjectEstimateRow[];
  selectedEstimate: ProjectEstimateRow | null;
  uiLocked: boolean;
  pendingDeleteEstimate: boolean;
  pendingSaveEstimate: boolean;
  saveState: "saved" | "dirty" | "saving" | "error";
  saveMessage: string;
  onSelectEstimate: (estimateId: string) => void;
  onSaveDraft: () => void;
  onNewProject: () => void;
  onDeleteProject: () => void;
}) {
  const isReadOnlyEstimate =
    selectedEstimate !== null && selectedEstimate.status !== "draft";
  const canDeleteEstimate =
    selectedEstimate !== null &&
    selectedEstimate.status !== "approved" &&
    selectedEstimate.status !== "submitted";

  return (
    <header className="sticky top-0 z-20 border-b border-apple-mist bg-white/95 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="flex min-h-[48px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {selectedEstimate ? (
            <select
              value={selectedEstimate.id}
              onChange={(event) => onSelectEstimate(event.target.value)}
              disabled={uiLocked}
              className="h-11 min-w-[280px] rounded-[10px] border border-apple-mist bg-white px-4 text-base font-semibold text-apple-charcoal outline-none transition hover:border-[#1f6a37]/60 hover:bg-[#f8fbf9] focus:border-[#1f6a37] focus:bg-[#f8fbf9]"
            >
              {estimates.map((estimate) => (
                <option key={estimate.id} value={estimate.id}>
                  {estimate.project_name || "Untitled estimate"}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex h-11 items-center rounded-[10px] border border-apple-mist bg-white px-4 text-sm text-apple-smoke">
              No project selected
            </div>
          )}

          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium",
              saveState === "saving"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : saveState === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : saveState === "dirty"
                    ? "border-sky-200 bg-sky-50 text-sky-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {saveState === "saving" ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            <span>{saveMessage}</span>
          </div>

          {selectedEstimate ? (
            <EstimateStatusBadge status={selectedEstimate.status} />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          {!isReadOnlyEstimate && selectedEstimate ? (
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={uiLocked || saveState !== "dirty"}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#1f6a37] px-4 text-sm font-semibold text-white transition hover:bg-[#18552d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingSaveEstimate ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save draft
            </button>
          ) : null}
          <button
            type="button"
            onClick={onNewProject}
            disabled={uiLocked}
            className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-apple-mist bg-white px-4 text-sm font-medium text-apple-charcoal transition hover:bg-apple-mist/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FolderPlus size={16} />
            New project
          </button>
          {canDeleteEstimate ? (
            <button
              type="button"
              onClick={onDeleteProject}
              disabled={uiLocked}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-rose-200 bg-white px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-50 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingDeleteEstimate ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              Delete project
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
