import Link from "next/link";
import styles from "@/components/workspace/workspace.module.css";
import type { GmeaProject } from "../types";
import { formatMoney, projectSummary } from "../utils/gmeaCalculations";
import GmeaProjectStatusBadge from "./GmeaProjectStatusBadge";
import GmeaProjectActionsMenu from "./GmeaProjectActionsMenu";
import { projectColor } from "../utils/projectAppearance";

export default function GmeaPortfolioTable({ projects, canEdit, onDetails }: {
  projects: GmeaProject[]; canEdit: boolean; onDetails: (project: GmeaProject) => void;
}) {
  return <div className="overflow-x-auto"><table className={styles.table}>
    <thead><tr>{["Project", "Client", "Location", "Contract", "Expenses", "Status", "Actions"].map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead>
    <tbody>{projects.map((project) => {
      const summary = projectSummary(project);
      return <tr key={project.id}>
        <th scope="row" className="font-medium"><Link href={`/gmea-projects/${project.id}`} className={`${styles.recordLink} inline-flex items-center gap-2`}><span aria-label={`Project color ${projectColor(project)}`} className="h-2.5 w-2.5 shrink-0 rounded-sm border border-black/15" style={{ backgroundColor: projectColor(project) }} />{project.title}</Link><p className="mt-1 text-xs font-normal text-slate-500">{project.name}</p></th>
        <td>{project.client || "Client not set"}</td><td>{project.location}</td>
        <td className="whitespace-nowrap tabular-nums">{formatMoney(summary.contract)}</td><td className="whitespace-nowrap tabular-nums">{formatMoney(summary.expenses)}</td>
        <td><GmeaProjectStatusBadge status={project.status} /></td><td><div className="flex items-center gap-2">
          <Link href={`/gmea-projects/${project.id}`} className={styles.button} aria-label={`Open project: ${project.title}`}>Open</Link>
          {canEdit ? <GmeaProjectActionsMenu project={project} onDetails={() => onDetails(project)} /> : <button className={styles.button} type="button" onClick={() => onDetails(project)}>Details</button>}
        </div></td>
      </tr>;
    })}</tbody>
  </table></div>;
}
