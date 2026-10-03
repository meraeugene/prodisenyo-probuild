import type { ProjectRecord } from "../types";
import { formatProjectCurrency, getProjectStatusPresentation } from "../utils/projectPresentation";
import styles from "./projects.module.css";

export default function CeoProjectsTable({ projects, onOpenProject }: {
  projects: ProjectRecord[];
  onOpenProject: (projectId: string) => void;
}) {
  return <>
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[1060px] border-collapse text-left text-[13px]">
        <caption className="sr-only">Project budgets, delivery progress, assignments, and status</caption>
        <thead><tr className="border-y border-[#edf3f1] text-xs text-[#53736f]">
          {["Project", "Location", "Progress", "Budget", "Actual spend", "Target date", "Engineer", "Status", ""].map((label, index) => <th key={index} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{label || <span className="sr-only">Actions</span>}</th>)}
        </tr></thead>
        <tbody>{projects.map(project => {
          const status = getProjectStatusPresentation(project);
          const color = status.tone === "rose" ? "text-[#aa5353]" : status.tone === "amber" ? "text-[#986c26]" : "text-[#076d69]";
          return <tr key={project.id} className="border-b border-[#edf3f1] transition hover:bg-[#f7fcfa]">
            <th scope="row" className="min-w-40 px-4 py-4 font-medium text-[#1d1d1f]"><button onClick={() => onOpenProject(project.id)} className="text-left hover:text-[#076d69]">{project.name}</button><p className="mt-1 text-[11px] font-normal text-[#53736f]">PRJ-{project.id.slice(0, 8).toUpperCase()}</p></th>
            <td className="px-4 py-4 text-[#53736f]">{project.location}</td>
            <td className="min-w-28 px-4 py-4"><span className="tabular-nums">{project.progress}%</span><progress className={`${styles.progress} mt-2`} value={project.progress} max={100} aria-label={`${project.name} progress`} /></td>
            <td className="whitespace-nowrap px-4 py-4 tabular-nums">{formatProjectCurrency(project.budget)}</td>
            <td className="whitespace-nowrap px-4 py-4 tabular-nums">{formatProjectCurrency(project.spent)}</td>
            <td className="whitespace-nowrap px-4 py-4 text-[#53736f]">{project.endDate}</td>
            <td className="px-4 py-4 text-[#53736f]">{project.status === "planning" ? project.estimateEngineer || "Unassigned" : project.engineer}</td>
            <td className="px-4 py-4"><span className={`inline-flex items-center gap-2 whitespace-nowrap text-xs ${color}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{status.label}</span></td>
            <td className="px-4 py-4"><button type="button" onClick={() => onOpenProject(project.id)} aria-label={`View ${project.name}`} className="rounded-lg px-3 py-2 font-medium text-[#076d69] hover:bg-[#eaf5f3]">View</button></td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    {!projects.length && <p role="status" className="px-4 py-14 text-center text-sm text-[#53736f]">No matching projects. Try another search or filter.</p>}
    <p className="px-4 py-4 text-xs text-[#53736f]" aria-live="polite">Showing {projects.length} {projects.length === 1 ? "project" : "projects"}</p>
  </>;
}
