"use client";

import type { ReactNode } from "react";
import {
  ArrowLeft,
  ClipboardList,
  FileText,
} from "lucide-react";
import WorkspaceTabSwitch from "@/components/workspace/WorkspaceTabSwitch";
import type { ProjectRecord } from "../types";
import type { ImportedProgressActivity } from "../utils/engineeringProgressImport";
import {
  buildProgressSummary,
  type EngineeringProgressActivityRecord,
} from "../utils/engineeringWorkspace";
import EngineeringProgressWorksheet from "./EngineeringProgressWorksheet";

export type EngineeringWorkspaceTab = "progress" | "materials";

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

interface EngineeringWorkspaceProps {
  project: ProjectRecord;
  tab: EngineeringWorkspaceTab;
  activities: EngineeringProgressActivityRecord[];
  materialsCount: number;
  materialContent: ReactNode;
  readOnly?: boolean;
  isSubmitting?: boolean;
  onBack: () => void;
  onTabChange: (tab: EngineeringWorkspaceTab) => void;
  onSubmitProgress: (activities: ImportedProgressActivity[]) => void;
}

export default function EngineeringWorkspace({
  project,
  tab,
  activities,
  materialsCount,
  materialContent,
  readOnly = false,
  isSubmitting = false,
  onBack,
  onTabChange,
  onSubmitProgress,
}: EngineeringWorkspaceProps) {
  const activityRows = Array.isArray(activities) ? activities : [];
  const progressSummary = buildProgressSummary(activityRows);
  const tabs = [
    { id: "progress", label: "Progress", icon: FileText, count: activityRows.length },
    { id: "materials", label: "Materials", icon: ClipboardList, count: materialsCount },
  ] as const;
  return (
    <div className="space-y-4 text-sm">
      <header className="rounded-lg border border-transparent bg-white px-4 py-3 shadow-workspace">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to projects"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Engineering workspace
              </p>
              <h2 className="truncate text-xl font-bold text-apple-charcoal">
                {project.name}
              </h2>
            </div>
          </div>

          <div className="rounded-md bg-slate-50 px-3 py-2 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Overall progress
            </p>
            <p className="text-lg font-bold text-teal-700">
              {formatPercent(progressSummary.overallProgress)}
            </p>
          </div>
        </div>
      </header>

      <WorkspaceTabSwitch label="Engineering workspace sections" items={tabs.map((item) => ({ value: item.id, count: item.count,
        label: <span className="inline-flex items-center gap-2"><item.icon size={15} aria-hidden="true" />{item.label}</span> }))}
        value={tab} onChange={onTabChange} />

      {tab === "progress" ? (
        <EngineeringProgressWorksheet
          activities={activityRows}
          readOnly={readOnly}
          isSubmitting={isSubmitting}
          onSubmitProgress={onSubmitProgress}
        />
      ) : null}

      {tab === "materials" ? materialContent : null}
    </div>
  );
}
