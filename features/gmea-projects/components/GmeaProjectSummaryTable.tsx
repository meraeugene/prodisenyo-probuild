import Link from "next/link";
import type { ReactNode } from "react";
import type { GmeaProject } from "../types";
import { contractCollectionSummary, formatMoney, projectSummary, sumMoney } from "../utils/gmeaCalculations";
import styles from "@/components/workspace/workspace.module.css";
import layout from "./gmeaProjectTable.module.css";
import type { CeoGmeaSort } from "../utils/ceoPortfolioSorting";
import CeoSortButton from "@/features/ceo-workspace/components/CeoSortButton";
import GmeaProjectStatusBadge from "./GmeaProjectStatusBadge";

export default function GmeaProjectSummaryTable({ projects, totalProjects = projects, renderActions, sort, direction = "desc", onSort }: {
  projects: GmeaProject[]; totalProjects?: GmeaProject[]; renderActions: (project: GmeaProject) => ReactNode;
  sort?: CeoGmeaSort; direction?: "asc" | "desc"; onSort?: (value: CeoGmeaSort) => void;
}) {
  const totals = totalProjects.map(project => ({ ...projectSummary(project), ...contractCollectionSummary(project) }));
  const sortLabel = (label: string, field: CeoGmeaSort) => onSort ? <CeoSortButton label={label} active={sort === field} direction={direction} onClick={() => onSort(field)} /> : label;
  return <div className="min-w-0">
    <div className={layout.desktop}>
      <table data-row-hover="none" className={`${styles.table} ${layout.table}`} style={{ minWidth: 0, tableLayout: "fixed" }}>
        <caption className="sr-only">Projects, contract amounts, expenses and collections.</caption>
        <colgroup>{[18, 15, 12, 12, 12, 12, 10, 9].map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
        <thead><tr><th scope="col">{sortLabel("Project", "name")}</th><th scope="col">Client / Location</th>
          <th scope="col">{sortLabel("Contract", "contract")}</th><th scope="col">{sortLabel("Expenses", "expenses")}</th>
          <th scope="col">Collected</th><th scope="col">Outstanding</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
        <tbody>{projects.map(project => {
          const summary = projectSummary(project), collection = contractCollectionSummary(project);
          return <tr key={project.id}>
            <th scope="row"><Link className={styles.recordLink} href={`/gmea-projects/${project.id}`}>{project.title}</Link><p className="mt-1 text-xs font-normal text-slate-500">{project.name}</p></th>
            <td>{project.client || "—"}<p className="mt-1 text-xs text-slate-500">{project.location}</p></td>
            <td>{formatMoney(summary.contract)}</td><td>{formatMoney(summary.expenses)}</td><td>{formatMoney(collection.received)}</td><td>{formatMoney(collection.outstanding)}</td>
            <td><GmeaProjectStatusBadge status={project.status} /></td><td className={layout.actions}>{renderActions(project)}</td>
          </tr>;
        })}</tbody>
        {!!projects.length && <tfoot><tr><th scope="row" colSpan={2}>Filtered total ({totalProjects.length})</th>
          <td>{formatMoney(sumMoney(totals.map(row => row.contract)))}</td><td>{formatMoney(sumMoney(totals.map(row => row.expenses)))}</td>
          <td>{formatMoney(sumMoney(totals.map(row => row.received)))}</td><td>{formatMoney(sumMoney(totals.map(row => row.outstanding)))}</td><td colSpan={2} /></tr></tfoot>}
      </table>
    </div>
    <div className={layout.cards}>{projects.map(project => {
      const summary = projectSummary(project), collection = contractCollectionSummary(project);
      return <article key={project.id} className="min-w-0 border-b border-slate-200 p-5">
        <div className="flex items-start justify-between gap-3"><Link className={styles.recordLink} href={`/gmea-projects/${project.id}`}>{project.title}</Link><GmeaProjectStatusBadge status={project.status} /></div>
        <p className="mt-1 break-words text-sm text-slate-700">{project.name}</p><p className="mt-2 break-words text-xs text-slate-500">{[project.client, project.location].filter(Boolean).join(" · ")}</p>
        <dl className="my-4 grid grid-cols-2 gap-3 text-sm">{[["Contract", summary.contract], ["Expenses", summary.expenses], ["Collected", collection.received], ["Outstanding", collection.outstanding]].map(([label, amount]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words font-medium tabular-nums">{formatMoney(Number(amount))}</dd></div>)}</dl>
        {renderActions(project)}
      </article>;
    })}</div>
    {!projects.length && <p className={styles.empty}>No matching projects.</p>}
    {!!projects.length && <div className="flex flex-wrap gap-x-8 gap-y-2 border-t border-slate-200 px-5 py-4 text-sm">
      <p>Net profit / loss <strong className="ml-2 tabular-nums">{formatMoney(sumMoney(totals.map(row => row.profit)))}</strong></p>
      <p className={layout.cards}>Filtered total: {formatMoney(sumMoney(totals.map(row => row.contract)))} contract · {formatMoney(sumMoney(totals.map(row => row.expenses)))} expenses</p>
    </div>}
  </div>;
}
