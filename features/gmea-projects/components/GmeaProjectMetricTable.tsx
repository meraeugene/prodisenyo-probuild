import Link from "next/link";
import { formatMoney } from "../utils/gmeaCalculations";
import { formatProjectMetric, projectMetricDetailColumns, projectMetricValue, type ProjectMetric, type ProjectMetricRecord } from "../utils/projectMetrics";
import GmeaProjectStatusBadge from "./GmeaProjectStatusBadge";
import styles from "@/components/workspace/workspace.module.css";
import layout from "./gmeaProjectTable.module.css";

export default function GmeaProjectMetricTable({ rows, metric }: { rows: ProjectMetricRecord[]; metric: ProjectMetric }) {
  const columns = projectMetricDetailColumns(metric);
  return <>
    <div className={layout.desktop}><table className={`${styles.table} ${layout.table}`} style={{ minWidth: 0, tableLayout: "fixed" }} data-row-hover="none">
      <colgroup>{[28, 13, 17, 17, 17, 8].map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
      <thead><tr>{["Project / Client", "Status", ...columns.map(column => column.label), "Details"].map(heading => <th key={heading} scope="col">{heading}</th>)}</tr></thead>
      <tbody>{rows.map(record => <tr key={record.project.id}>
        <th scope="row"><Link href={`/gmea-projects/${record.project.id}`} className={styles.recordLink}>{record.project.title}</Link><p className="mt-1 text-xs font-normal text-slate-500">{record.project.client || "—"}</p></th>
        <td><GmeaProjectStatusBadge status={record.project.status} /></td>{columns.map(column => <td key={column.field} className={column.field === "metric" ? metric === "loss" ? "font-semibold text-rose-700" : "font-semibold" : ""}>{column.field === "metric" ? formatProjectMetric(projectMetricValue(record, metric), metric) : formatMoney(record[column.field])}</td>)}
        <td><Link href={`/gmea-projects/${record.project.id}`} aria-label={`View ${record.project.title}`} className={styles.recordLink}>View</Link></td>
      </tr>)}</tbody>
    </table></div>
    <div className={layout.cards}>{rows.map(record => <article key={record.project.id} className="border-b border-slate-200 p-5">
      <div className="flex items-start justify-between gap-3"><Link href={`/gmea-projects/${record.project.id}`} className={styles.recordLink}>{record.project.title}</Link><GmeaProjectStatusBadge status={record.project.status} /></div><p className="mt-1 text-xs text-slate-500">{record.project.client || "—"}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">{columns.map(column => <div key={column.field}><dt className="text-xs text-slate-500">{column.label}</dt><dd className="mt-1 break-words font-medium tabular-nums">{column.field === "metric" ? formatProjectMetric(projectMetricValue(record, metric), metric) : formatMoney(record[column.field])}</dd></div>)}</dl>
    </article>)}</div>
    {!rows.length && <p role="status" className={styles.empty}>No projects contribute to this total or match your search.</p>}
  </>;
}
