import type { ProjectRecord } from "../types";
import { formatProjectCurrency, getProjectStatusPresentation } from "../utils/projectPresentation";
import styles from "./projects.module.css";
import CeoSortButton from "@/features/ceo-workspace/components/CeoSortButton";
import ceoStyles from "@/components/workspace/workspace.module.css";
import { formatPortfolioDate } from "../utils/projectPortfolioSelectors";
import type { CeoProjectSort } from "../utils/ceoProjectPortfolio";

export default function CeoProjectsTable({ projects, onOpenProject, sort, direction, onSort }: {
  projects: ProjectRecord[];
  onOpenProject: (projectId: string) => void;
  sort: CeoProjectSort; direction: "asc" | "desc"; onSort: (value: CeoProjectSort) => void;
}) {
  return <>
    <div className="relative overflow-x-auto">
      <table className={ceoStyles.table}>
        <caption className="sr-only">Project budgets, delivery progress, assignments, and status</caption>
        <thead><tr className="border-y border-[#edf3f1] text-xs text-[#53736f]">
          {([
            { label: "Project", field: "name" }, { label: "Location" }, { label: "Progress", field: "progress" },
            { label: "Budget", field: "budget" }, { label: "Actual spend", field: "spent" }, { label: "Target date", field: "endDate" },
            { label: "Engineer" }, { label: "Status" }, { label: "Actions" },
          ] as { label: string; field?: CeoProjectSort }[]).map(({ label, field }) => <th key={label} scope="col" aria-sort={field && sort === field ? direction === "asc" ? "ascending" : "descending" : undefined}>
            {field ? <CeoSortButton label={label} active={sort === field} direction={direction} onClick={() => onSort(field)} /> : label}
          </th>)}
        </tr></thead>
        <tbody>{projects.map(project => {
          const status = getProjectStatusPresentation(project);
          const color = status.tone === "rose" ? "text-[#aa5353]" : status.tone === "amber" ? "text-[#986c26]" : "text-[#076d69]";
          return <tr key={project.id} className="border-b border-[#edf3f1] transition hover:bg-[#f7fcfa]">
            <th scope="row" className="min-w-40 font-medium text-[#1d1d1f]"><button type="button" onClick={() => onOpenProject(project.id)} className={`${ceoStyles.recordLink} text-left`}>{project.name}</button><p className="mt-1 text-[11px] font-normal text-slate-500">PRJ-{project.id.slice(0, 8).toUpperCase()}</p></th>
            <td className="px-4 py-4 text-[#53736f]">{project.location}</td>
            <td className="min-w-28 px-4 py-4"><span className="tabular-nums">{project.progress}%</span><progress className={`${styles.progress} mt-2`} value={project.progress} max={100} aria-label={`${project.name} progress`} /></td>
            <td className="whitespace-nowrap px-4 py-4 tabular-nums">{formatProjectCurrency(project.budget)}</td>
            <td className="whitespace-nowrap px-4 py-4 tabular-nums">{formatProjectCurrency(project.spent)}</td>
            <td className="whitespace-nowrap text-slate-500">{formatPortfolioDate(project.endDate)}</td>
            <td className="px-4 py-4 text-[#53736f]">{project.status === "planning" ? project.estimateEngineer || "Unassigned" : project.engineer}</td>
            <td className="px-4 py-4"><span className={`inline-flex items-center gap-2 whitespace-nowrap text-xs ${color}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{status.label}</span></td>
            <td><button type="button" onClick={() => onOpenProject(project.id)} aria-label={`View ${project.name}`} className={ceoStyles.button}>View details</button></td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    {!projects.length && <p role="status" className={ceoStyles.empty}>No matching projects. Try another search or reset the filters.</p>}
  </>;
}
