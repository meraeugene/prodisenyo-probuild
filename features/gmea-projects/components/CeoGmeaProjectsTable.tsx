import Link from "next/link";
import type { GmeaProject } from "../types";
import { contractCollectionSummary, formatMoney, projectSummary } from "../utils/gmeaCalculations";
import { buildCeoProjectTableTotals } from "../utils/ceoPortfolio";
import { projectColor } from "../utils/projectAppearance";
import type { CeoGmeaSort } from "../utils/ceoPortfolioSorting";
import CeoSortButton from "@/features/ceo-workspace/components/CeoSortButton";
import styles from "@/features/ceo-workspace/components/ceoWorkspace.module.css";
import GmeaProjectStatusBadge from "./GmeaProjectStatusBadge";

export default function CeoGmeaProjectsTable({ projects, totalProjects = projects, sort, direction = "desc", onSort }: {
  projects: GmeaProject[]; totalProjects?: GmeaProject[];
  sort?: CeoGmeaSort; direction?: "asc" | "desc"; onSort?: (value: CeoGmeaSort) => void;
}) {
  const totals = buildCeoProjectTableTotals(totalProjects);
  const columns: { label: string; field?: CeoGmeaSort }[] = [
    { label: "Project", field: "name" }, { label: "Client / Location" }, { label: "Contract Amount", field: "contract" },
    { label: "Total Expenses", field: "expenses" }, { label: "Collected Amount", field: "collected" },
    { label: "Outstanding", field: "outstanding" }, { label: "Collection Progress" }, { label: "Actions" },
  ];
  return <div className="overflow-x-auto border-t border-slate-200">
    <table className={styles.table}>
      <caption className="sr-only">GMEA project contracts, expenses, and collections</caption>
      <thead><tr>{columns.map(({ label, field }) => <th key={label} scope="col" aria-sort={field && sort === field ? direction === "asc" ? "ascending" : "descending" : undefined}>
        {field && onSort ? <CeoSortButton label={label} active={sort === field} direction={direction} onClick={() => onSort(field)} /> : label}
      </th>)}</tr></thead>
      <tbody>{projects.map((project) => {
        const summary = projectSummary(project);
        const collection = contractCollectionSummary(project);
        const progress = summary.contract > 0 ? Math.min(100, Math.round(collection.received / summary.contract * 100)) : 0;
        return <tr key={project.id}>
          <th scope="row" className="min-w-[190px] font-normal">
            <div className="flex items-start gap-2">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: projectColor(project) }} aria-hidden="true" />
              <div><Link href={`/gmea-projects/${project.id}`} className={styles.recordLink}>{project.title}</Link>
                <p className="mt-1 text-xs text-slate-500">{project.name}</p>
                <span className="mt-1.5 inline-flex"><GmeaProjectStatusBadge status={project.status} /></span>
              </div>
            </div>
          </th>
          <td className="min-w-[170px]"><p className="text-slate-700">{project.client || "Client not set"}</p><p className="mt-1 text-xs text-slate-500">{project.location || "Location not set"}</p></td>
          <td className="whitespace-nowrap tabular-nums">{formatMoney(summary.contract)}</td>
          <td className="whitespace-nowrap tabular-nums">{formatMoney(summary.expenses)}</td>
          <td className="whitespace-nowrap tabular-nums">{formatMoney(collection.received)}</td>
          <td className="whitespace-nowrap tabular-nums">{formatMoney(collection.outstanding)}</td>
          <td className="min-w-[140px]"><span className="text-xs text-slate-600">{progress}%</span><progress aria-label={`${project.title} collection progress`} value={progress} max={100} className="mt-2 block h-1.5 w-full accent-[#076d69]" /></td>
          <td><Link href={`/gmea-projects/${project.id}`} aria-label={`View details for ${project.title}`} className={`${styles.button} whitespace-nowrap`}>View details</Link></td>
        </tr>;
      })}</tbody>
      {projects.length > 0 && <tfoot><tr>
        <th scope="row" colSpan={2} className="font-medium">Filtered total ({totalProjects.length} projects)</th>
        <td className="whitespace-nowrap font-medium tabular-nums">{formatMoney(totals.contract)}</td>
        <td className="whitespace-nowrap font-medium tabular-nums">{formatMoney(totals.expenses)}</td>
        <td className="whitespace-nowrap font-medium tabular-nums">{formatMoney(totals.collected)}</td>
        <td className="whitespace-nowrap font-medium tabular-nums">{formatMoney(totals.outstanding)}</td>
        <td className="font-medium">{totals.progress}%</td><td />
      </tr></tfoot>}
    </table>
    {!projects.length && <p role="status" className={styles.empty}>No matching projects. Try another search or reset the filters.</p>}
  </div>;
}
