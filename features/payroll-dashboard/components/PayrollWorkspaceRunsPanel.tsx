"use client";
import { useState } from "react";
import Link from "next/link";
import WorkspaceListToolbar from "@/components/workspace/WorkspaceListToolbar";
import WorkspaceListPagination from "@/components/workspace/WorkspaceListPagination";
import styles from "@/components/workspace/workspace.module.css";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import type { PayrollDashboardRunStatus, PayrollWorkspaceRun } from "../types";
import { formatPayrollCurrency, formatPayrollDate } from "../utils/payrollDashboard";
import { PAYROLL_STATUS_LABELS, payrollRunHref } from "../utils/payrollWorkspacePresentation";

export default function PayrollWorkspaceRunsPanel({ runs }: { runs: PayrollWorkspaceRun[] }) {
  const [status, setStatus] = useState<PayrollDashboardRunStatus | "all">("draft");
  const [query, setQuery] = useState("");
  const [site, setSite] = useState("all");
  const tabs = [{ value: "all" as const, label: "All payrolls", count: runs.length },
    ...(["draft", "submitted", "approved", "rejected"] as const).map((value) => ({
      value, label: PAYROLL_STATUS_LABELS[value], count: runs.filter((run) => run.status === value).length,
    }))];
  const filtered = runs.filter((run) => (status === "all" || run.status === status)
    && (site === "all" || run.siteName === site)
    && [run.periodLabel, run.siteName].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  const pagination = useTablePagination(filtered, JSON.stringify([status, site, query]));
  return <section aria-label="Payroll records" className={`mt-6 ${styles.panel}`}>
    <WorkspaceListToolbar tabs={tabs} tab={status} onTabChange={setStatus} query={query} onQueryChange={setQuery}
      searchLabel="Search payrolls" placeholder="Search period or site" hasFilters={Boolean(query || site !== "all" || status !== "draft")}
      onReset={() => { setStatus("draft"); setQuery(""); setSite("all"); }}>
      <label className={styles.field}>Site<select className={styles.control} value={site} onChange={(event) => setSite(event.target.value)}>
        <option value="all">All sites</option>{[...new Set(runs.map((run) => run.siteName))].sort().map((name) => <option key={name}>{name}</option>)}
      </select></label>
    </WorkspaceListToolbar>
    <div className="overflow-x-auto"><table className={styles.table} style={{ minWidth: 720 }}>
      <thead><tr><th scope="col">Payroll period</th><th scope="col">Site</th><th scope="col">Status</th><th scope="col">Net payroll</th><th scope="col">Updated</th><th scope="col">Action</th></tr></thead>
      <tbody>{pagination.pageRows.map((run) => <tr key={run.id}>
        <th scope="row" className="font-medium">{run.periodLabel}</th><td>{run.siteName}</td>
        <td><span className="rounded bg-slate-100 px-2 py-1 text-xs">{PAYROLL_STATUS_LABELS[run.status]}</span></td>
        <td className="tabular-nums">{formatPayrollCurrency(run.netTotal)}</td><td>{formatPayrollDate(run.updatedAt)}</td>
        <td><Link className={styles.recordLink} href={payrollRunHref(run)}>{run.status === "draft" || run.status === "rejected" ? "Open Payroll" : "View Payroll"}</Link></td>
      </tr>)}</tbody>
    </table></div>
    {!filtered.length && <p className={styles.empty}>No payrolls match these filters.</p>}
    <WorkspaceListPagination {...pagination} total={filtered.length} noun="payrolls" label="Payroll table" />
  </section>;
}
