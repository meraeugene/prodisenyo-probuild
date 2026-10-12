import type { ProjectRecord } from "@/features/projects/types";
import styles from "@/components/workspace/workspace.module.css";
import { formatPortfolioDate } from "../utils/projectPortfolioSelectors";
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
    <header className={styles.header}>
      <div className="flex w-full flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className={styles.eyebrow}>Workspace / Projects</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className={`${styles.title} break-words`}>
              {project.name}
            </h1>
            <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${STATUS_CLASSES[status.tone]}`}>
              {status.label}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#667085]">
            <span className="inline-flex items-center gap-1.5">
               {project.status === "planning" ? "Estimate Engineer" : "Engineer / PM"}: {project.status === "planning" ? project.estimateEngineer : project.engineer}
            </span>
            <span className="inline-flex items-center gap-1.5">
               {project.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
               {formatPortfolioDate(project.startDate)} – {formatPortfolioDate(project.endDate)}
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
