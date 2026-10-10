import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "@/components/workspace/workspace.module.css";
import type { GmeaOverviewMetric, GmeaOverviewRecord } from "../types";
import { formatOverviewMetric, overviewRecordValue } from "../utils/gmeaOverviewMetrics";
import { overviewDetailColumns, overviewRecordStatus } from "../utils/gmeaOverviewDetailColumns";

export default function GmeaOverviewDetailsTable({ rows, metric, filteredTotal, filteredCount, hasFilters }: {
  rows: GmeaOverviewRecord[]; metric: GmeaOverviewMetric; filteredTotal: number; filteredCount: number; hasFilters: boolean;
}) {
  const columns = overviewDetailColumns(metric);
  return <div className="overflow-x-auto">
    <table className={styles.table} aria-label="GMEA metric records">
      <thead><tr><th scope="col">Project / rental</th><th scope="col">Division</th><th scope="col">Status</th>
        {columns.map((column) => <th key={column.field} scope="col" className="text-right">{column.label}</th>)}<th scope="col">Details</th>
      </tr></thead>
      <tbody>{rows.map((record) => <tr key={record.id}>
        <td className="max-w-[300px]"><Link href={record.href} className={`${styles.recordLink} break-words`}>{record.name}</Link><p className="mt-1 text-xs text-slate-500">{record.client || "—"}</p></td>
        <td>{record.division}</td>
        <td><span className={`inline-flex whitespace-nowrap rounded px-2 py-1 text-xs font-medium ${record.status === "completed" ? "bg-green-100 text-green-800" : record.status === "active" ? "bg-yellow-200 text-yellow-900" : "bg-slate-100 text-slate-700"}`}>{overviewRecordStatus(record)}</span></td>
        {columns.map((column) => <td key={column.field} className={`whitespace-nowrap text-right tabular-nums ${column.field === "metric" && metric === "loss" ? "font-semibold text-rose-700" : ""}`}>
          {formatOverviewMetric(column.field === "metric" ? overviewRecordValue(record, metric) : record[column.field], column.field === "metric" ? metric : "revenue")}
        </td>)}
        <td><Link href={record.href} aria-label={`View ${record.name}`} className={`${styles.recordLink} inline-flex items-center gap-1 whitespace-nowrap`}>View details<ArrowUpRight aria-hidden="true" size={14} /></Link></td>
      </tr>)}</tbody>
      {rows.length > 0 && <tfoot><tr><th scope="row" colSpan={5}>{hasFilters ? "Filtered total" : "Total"} · {filteredCount} {filteredCount === 1 ? "record" : "records"}</th><td colSpan={2} className="whitespace-nowrap text-right font-semibold tabular-nums">{formatOverviewMetric(filteredTotal, metric)}</td></tr></tfoot>}
    </table>
    {rows.length === 0 && <div className={styles.empty}>{hasFilters ? "No records match your search or division filter." : "There are no records contributing to this total yet."}</div>}
  </div>;
}
