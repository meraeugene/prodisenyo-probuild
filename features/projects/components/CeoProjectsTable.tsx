import type { ProjectRecord, ProjectStatus } from "../types";
import { formatProjectCurrency, getProjectStatusPresentation } from "../utils/projectPresentation";

export default function CeoProjectsTable({ projects, onOpenProject }: {
  projects: ProjectRecord[];
  onOpenProject: (projectId: string) => void;
}) {
  return (
    <div className="overflow-x-auto border-t border-slate-200">
      <div className="min-w-[1080px]">
        <div className="grid grid-cols-[1.15fr_1fr_.9fr_.85fr_.85fr_.95fr_.95fr_1.15fr_.6fr] gap-4 border-b border-slate-200 px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.04em] text-slate-400">
          <span>Project</span><span>Location</span><span>Progress</span><span>Budget</span><span>Actual Spent</span><span>Schedule</span><span>Engineer</span><span>Status</span><span>View Details</span>
        </div>
        <div className="divide-y divide-slate-100">
          {projects.map((project) => {
            const status = getProjectStatusPresentation(project);
            const statusColor: Record<ProjectStatus, string> = { active: "text-emerald-700", planning: "text-blue-700", completed: "text-sky-700", on_hold: "text-amber-700" };
            return (
              <div key={project.id} className="grid grid-cols-[1.15fr_1fr_.9fr_.85fr_.85fr_.95fr_.95fr_1.15fr_.6fr] items-center gap-4 px-4 py-3 text-[11px] hover:bg-slate-50/70">
                <div className="min-w-0"><p className="truncate font-semibold text-slate-950">{project.name}</p><p className="mt-0.5 truncate text-[9px] text-slate-400">PRJ-{project.id.slice(0, 8).toUpperCase()}</p></div>
                <p className="truncate text-slate-500">{project.location}</p>
                <div><p className="font-semibold text-slate-700">{project.progress}%</p><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${project.progress}%` }} /></div></div>
                <strong className="truncate font-semibold text-slate-900 tabular-nums">{formatProjectCurrency(project.budget)}</strong>
                <strong className="truncate font-semibold text-slate-900 tabular-nums">{formatProjectCurrency(project.spent)}</strong>
                <p className="truncate text-slate-500">{project.endDate}</p>
                <p className="truncate text-slate-600">{project.status === "planning" ? project.estimateEngineer : project.engineer}</p>
                <span className={`inline-flex items-center gap-1.5 whitespace-nowrap font-semibold ${statusColor[project.status]}`}><i className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />{status.label}</span>
                <button type="button" onClick={() => onOpenProject(project.id)} className="text-left font-semibold text-blue-700 hover:text-blue-900">View</button>
              </div>
            );
          })}
          {!projects.length ? <p className="py-14 text-center text-sm text-slate-500">No matching projects.</p> : null}
        </div>
      </div>
    </div>
  );
}
