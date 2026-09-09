import { CalendarDays, MapPin, UserRound } from "lucide-react";
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
    <header className="rounded-3xl bg-[#075e5b] p-6 text-white sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">Prodisenyo Projects</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="break-words text-3xl font-semibold tracking-tight sm:text-4xl">
              {project.name}
            </h1>
            <span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${STATUS_CLASSES[status.tone]}`}>
              {status.label}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-teal-50/80">
            <span className="inline-flex items-center gap-1.5">
              <UserRound size={14} /> {project.status === "planning" ? "Estimate Engineer" : "Engineer / PM"}: {project.status === "planning" ? project.estimateEngineer : project.engineer}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} /> {project.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} /> {project.startDate} – {project.endDate}
            </span>
          </div>
        </div>
        <div className="shrink-0 rounded-2xl bg-white/10 px-5 py-4 lg:text-right">
          <p className="text-xs font-medium text-teal-100">Budget ceiling</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white tabular-nums">
            {formatProjectCurrency(project.budget)}
          </p>
        </div>
      </div>
    </header>
  );
}
