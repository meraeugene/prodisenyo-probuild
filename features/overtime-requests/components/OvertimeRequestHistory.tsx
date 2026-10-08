"use client";
import { useState } from "react";
import WorkspaceListToolbar from "@/components/workspace/WorkspaceListToolbar";
import WorkspaceListPagination from "@/components/workspace/WorkspaceListPagination";
import styles from "@/components/workspace/workspace.module.css";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import type { OvertimeRequestRecord } from "../types";
import { formatOvertimeRequestDateTime, getOvertimeRequestStatusClasses, getOvertimeRequestStatusLabel } from "../utils/overtimeRequestPresentation";

export default function OvertimeRequestHistory({ requests }: { requests: OvertimeRequestRecord[] }) {
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const tabs = [{ value: "all", label: "All requests", count: requests.length },
    ...(["pending", "approved", "rejected"] as const).map((value) => ({ value,
      label: getOvertimeRequestStatusLabel(value), count: requests.filter((request) => request.status === value).length }))];
  const filtered = requests.filter((request) => (status === "all" || request.status === status)
    && [request.employee_name, request.site_name, request.period_label, request.request_date, request.reason, request.rejection_reason]
      .join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  const pagination = useTablePagination(filtered, JSON.stringify([status, query]));
  return <section aria-label="Your overtime requests" className={styles.panel}>
    <h2 className="px-4 py-4 text-base font-semibold">Your Overtime Requests</h2>
    <WorkspaceListToolbar tabs={tabs} tab={status} onTabChange={setStatus} query={query} onQueryChange={setQuery}
      searchLabel="Search requests" placeholder="Search employee, site, period or date" hasFilters={Boolean(query || status !== "all")}
      onReset={() => { setQuery(""); setStatus("all"); }} />
    <div className="overflow-x-auto"><table className={styles.table} style={{ minWidth: 640 }}>
      <thead><tr><th scope="col">Employee / Site</th><th scope="col">Work date</th><th scope="col">Hours</th><th scope="col">Status</th><th scope="col">Submitted / Return reason</th></tr></thead>
      <tbody>{pagination.pageRows.map((request) => <tr key={request.id}>
        <th scope="row" className="font-medium">{request.employee_name}<p className="mt-1 text-xs font-normal text-slate-500">{request.site_name}<br />{request.period_label}</p></th>
        <td>{request.request_date}</td><td>{request.overtime_hours.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
        <td><span className={`rounded px-2 py-1 text-xs ${getOvertimeRequestStatusClasses(request.status)}`}>{getOvertimeRequestStatusLabel(request.status)}</span></td>
        <td className="text-xs">{formatOvertimeRequestDateTime(request.created_at)}{request.rejection_reason && <p className="mt-1">Return reason: {request.rejection_reason}</p>}</td>
      </tr>)}</tbody>
    </table></div>
    {!filtered.length && <p className={styles.empty}>{requests.length ? "No requests match these filters." : "No overtime requests submitted yet."}</p>}
    <WorkspaceListPagination {...pagination} total={filtered.length} noun="requests" label="Overtime history" />
  </section>;
}
