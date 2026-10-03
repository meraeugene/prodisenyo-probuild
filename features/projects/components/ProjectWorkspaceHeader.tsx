import type { ProjectRecord } from "@/features/projects/types";
import {
  formatProjectCurrency,
  getProjectStatusPresentation,
} from "@/features/projects/utils/projectPresentation";

const STATUS_CLASSES = {
  emerald: "bg-teal-50 text-teal-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  slate: "bg-slate-100 text-slate-700",
};

export default function ProjectWorkspaceHeader({
  project,
}: {
  project: ProjectRecord;
}) {
  const status = getProjectStatusPresentation(project);

  return (
    <header className="workspace-page-header workspace-header-actions bg-white pb-2">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="mb-2.5 text-xs font-normal text-[#53736f]">Prodisenyo Projects</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="break-words text-[28px] font-semibold leading-none tracking-[-0.045em] sm:text-[32px]">
              {project.name}
            </h1>
            <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${STATUS_CLASSES[status.tone]}`}>
              {status.label}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#53736f]">
            <span className="inline-flex items-center gap-1.5">
               {project.status === "planning" ? "Estimate Engineer" : "Engineer / PM"}: {project.status === "planning" ? project.estimateEngineer : project.engineer}
            </span>
            <span className="inline-flex items-center gap-1.5">
               {project.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
               {project.startDate} – {project.endDate}
            </span>
          </div>
        </div>
        <div className="shrink-0 rounded-2xl workspace-surface bg-white px-5 py-4 lg:text-right">
          <p className="text-xs font-medium text-[#53736f]">Budget ceiling</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#1d1d1f] tabular-nums">
            {formatProjectCurrency(project.budget)}
          </p>
        </div>
      </div>
    </header>
  );
}
