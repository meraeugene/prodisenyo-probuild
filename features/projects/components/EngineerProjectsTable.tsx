import { ArrowUpRight } from "lucide-react";
import styles from "@/components/workspace/workspace.module.css";
import { formatPortfolioDate } from "../utils/projectPortfolioSelectors";
import { getProjectStatusPresentation } from "../utils/projectPresentation";
import type { ProjectRecord } from "../types";
import ProjectThumbnail from "./ProjectThumbnail";

function StatusBadge({ project }: { project: ProjectRecord }) {
  const status = getProjectStatusPresentation(project);
  const tone = project.status === "planning" ? "bg-amber-50 text-amber-700" : project.status === "on_hold" ? "bg-rose-50 text-rose-700" : "bg-teal-50 text-teal-700";
  return <span className={`inline-flex rounded px-2 py-1 text-[11px] font-medium ${tone}`}>{status.label}</span>;
}

function ProgressCell({ project }: { project: ProjectRecord }) {
  if (project.status === "planning") return <p className="text-xs text-amber-700">Estimate required</p>;
  return <div className="max-w-40"><p className="text-xs font-medium text-slate-700">{project.progress}%</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eaf5f3]"><div className="h-full rounded-full bg-[#076d69]" style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }} /></div></div>;
}

export default function EngineerProjectsTable({ projects, hasFilters, onOpenProject }: {
  projects: ProjectRecord[]; hasFilters: boolean; onOpenProject: (id: string) => void;
}) {
  if (!projects.length) return <div className={styles.empty}><p className="font-medium text-slate-800">{hasFilters ? "No matching projects" : "No projects assigned yet"}</p><p className="mt-2">{hasFilters ? "Try a different search or reset your filters." : "Your projects will appear here when they are assigned to you."}</p></div>;
  function openButton(project: ProjectRecord) {
    return <button type="button" onClick={() => onOpenProject(project.id)} className={`${styles.button} whitespace-nowrap`} aria-label={`${project.status === "planning" ? "Cost estimate" : "View details"} for ${project.name}`}>
      {project.status === "planning" ? "Cost estimate" : "View details"}<ArrowUpRight size={14} aria-hidden="true" />
    </button>;
  }
  return <>
    <div className="hidden overflow-x-auto lg:block">
      <table className={`${styles.table} !min-w-[980px]`}>
        <thead><tr><th className="w-[30%]">Project</th><th className="w-[16%]">Progress</th><th>Status</th><th>Start date</th><th>Target completion</th><th className="text-right">Actions</th></tr></thead>
        <tbody>{projects.map(project => <tr key={project.id}>
          <td><div className="flex items-center gap-3"><ProjectThumbnail src={project.imageUrl} name={project.name} className="h-10 w-12 shrink-0 rounded object-cover" /><div className="min-w-0"><p className="font-medium text-slate-900">{project.name}</p><p className="mt-1 text-xs text-slate-500">{project.location || "Location not set"}</p></div></div></td>
          <td><ProgressCell project={project} /></td><td><StatusBadge project={project} /></td><td className="whitespace-nowrap text-slate-600">{formatPortfolioDate(project.startDate)}</td><td className="whitespace-nowrap text-slate-600">{formatPortfolioDate(project.endDate)}</td><td className="text-right">{openButton(project)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <div className="divide-y divide-slate-100 lg:hidden">{projects.map(project => <article key={project.id} className="space-y-4 p-4">
      <div className="flex items-start gap-3"><ProjectThumbnail src={project.imageUrl} name={project.name} className="h-10 w-12 shrink-0 rounded object-cover" /><div className="min-w-0 flex-1"><h2 className="break-words text-sm font-semibold text-slate-900">{project.name}</h2><p className="mt-1 text-xs text-slate-500">{project.location || "Location not set"}</p></div><StatusBadge project={project} /></div>
      <ProgressCell project={project} /><div className="flex flex-wrap items-end justify-between gap-3"><p className="text-xs leading-5 text-slate-500">Target completion<br /><span className="text-slate-700">{formatPortfolioDate(project.endDate)}</span></p>{openButton(project)}</div>
    </article>)}</div>
  </>;
}
