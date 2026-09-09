"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  UserRoundCheck,
} from "lucide-react";
import { toast } from "sonner";
import { activateProjectAfterEstimateAction } from "@/actions/estimateProcurement";
import EstimateReviewsPageClient from "@/features/cost-estimator/components/EstimateReviewsPageClient";
import type {
  ProjectEstimateItemRow,
  ReviewProjectEstimateRow,
} from "@/features/cost-estimator/types";
import type { EngineerOption, ProjectRecord } from "@/features/projects/types";
import ProjectWorkspaceHeader from "./ProjectWorkspaceHeader";

export default function PlanningProjectWorkspaceClient({
  project,
  engineers,
  estimates,
  estimateItems,
}: {
  project: ProjectRecord;
  engineers: EngineerOption[];
  estimates: ReviewProjectEstimateRow[];
  estimateItems: ProjectEstimateItemRow[];
}) {
  const router = useRouter();
  const [approved, setApproved] = useState(
    Boolean(project.activeApprovedEstimateId) ||
      estimates.some((estimate) => estimate.status === "approved"),
  );
  const [engineerId, setEngineerId] = useState(
    project.assignedEngineerId || project.assignedEstimateEngineerId || "",
  );
  const [isActivating, startActivation] = useTransition();

  function activateProject() {
    if (!approved) {
      toast.error("Approve the cost estimate before activating this project.");
      return;
    }
    if (!engineerId) {
      toast.error("Select the project engineer or manager.");
      return;
    }

    startActivation(async () => {
      try {
        await activateProjectAfterEstimateAction({ projectId: project.id, engineerId });
        toast.success("Project activated. The full project workspace is now available.");
        router.replace(`/projects/${project.id}`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to activate project.");
      }
    });
  }

  return (
    <div className="min-h-full space-y-5 bg-[#f6f8f8] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="py-1">
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2">
          <ArrowLeft size={15} /> Back to Projects
        </Link>
      </div>

      <ProjectWorkspaceHeader project={project} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,.04)]">
        <div className="mb-4">
          <h2 className="mt-1 text-xl font-bold text-slate-950">Estimate review</h2>
          <p className="mt-1 text-sm text-slate-500">Review the estimate, then assign an engineer to activate the project.</p>
        </div>
        <EstimateReviewsPageClient
          estimates={estimates}
          items={estimateItems}
          embedded
          projectId={project.id}
          onEstimateApproved={() => setApproved(true)}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,.04)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-700"><UserRoundCheck size={15} /> Final assignment</p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">Activate project</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Confirm the engineer responsible for delivery.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-[minmax(220px,1fr)_auto] lg:max-w-xl">
            <label className="text-xs font-semibold text-slate-700">
              Project engineer / manager
              <select value={engineerId} onChange={(event) => setEngineerId(event.target.value)} disabled={!approved || isActivating} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-400">
                <option value="">Select engineer</option>
                {engineers.map((engineer) => <option key={engineer.id} value={engineer.id}>{engineer.name}</option>)}
              </select>
            </label>
            <button type="button" onClick={activateProject} disabled={!approved || !engineerId || isActivating} className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-xl bg-teal-800 px-5 text-sm font-bold text-white transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:bg-slate-300">
              {isActivating ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {isActivating ? "Activating..." : "Activate Project"}
            </button>
          </div>
        </div>
        {!approved ? <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">This action becomes available after the CEO approves the submitted estimate.</p> : null}
      </section>
    </div>
  );
}
