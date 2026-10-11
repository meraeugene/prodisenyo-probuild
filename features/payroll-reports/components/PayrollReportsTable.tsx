import type { PayrollRunRow } from "../types";
import { formatPayrollReportCompactDateTime, formatPayrollReportPeriodLabel, formatPayrollReportPeso, getPayrollReportStatusLabel } from "../utils/payrollReportHelpers";
import styles from "@/components/workspace/workspace.module.css";

export default function PayrollReportsTable({ reports, deletingRunId, pendingDecisionRunId, onToggleMenu }: {
  reports: PayrollRunRow[]; deletingRunId: string | null; pendingDecisionRunId: string | null;
  onToggleMenu: (report: PayrollRunRow, rect: DOMRect) => void;
}) {
  if (!reports.length) return <p role="status" className={styles.empty}>No payroll reports match these filters.</p>;
  return <div className="overflow-x-auto">
    <table className={`${styles.table} min-w-[1100px]`}>
      <caption className="sr-only">Saved payroll runs by site and period</caption>
      <thead><tr>
        {["Submitted date", "Payroll period", "Project site", "Employees", "Hours", "Gross payroll", "Deductions", "Net payroll", "Status", "Actions"].map((label, index) =>
          <th key={label} scope="col" className={index >= 3 && index <= 7 ? "text-right" : undefined}>{label}</th>)}
      </tr></thead>
      <tbody>{reports.map(report => <tr key={report.id}>
        <td>{formatPayrollReportCompactDateTime(report.submitted_at ?? report.created_at)}</td>
        <th scope="row"><span className="font-medium">{formatPayrollReportPeriodLabel(report)}</span></th>
        <td>{report.site_name}</td>
        <td className="text-right tabular-nums">{report.employee_count}</td>
        <td className="text-right tabular-nums">{report.hours_worked.toLocaleString("en-PH", { maximumFractionDigits: 2 })}</td>
        <td className="text-right tabular-nums">{formatPayrollReportPeso(report.gross_total ?? 0)}</td>
        <td className="text-right tabular-nums">{formatPayrollReportPeso(report.deductions_total)}</td>
        <td className="text-right font-semibold tabular-nums">{formatPayrollReportPeso(report.net_total ?? 0)}</td>
        <td><span className={`inline-flex items-center gap-1.5 whitespace-nowrap ${report.status === "approved" ? "text-emerald-700" : report.status === "submitted" ? "text-amber-700" : "text-rose-700"}`}>
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{getPayrollReportStatusLabel(report.status)}
        </span></td>
        <td><button type="button" data-report-actions-root aria-label={`Review payroll for ${report.site_name}, ${formatPayrollReportPeriodLabel(report)}`}
          className={styles.button} disabled={deletingRunId === report.id || pendingDecisionRunId === report.id}
          onClick={event => onToggleMenu(report, event.currentTarget.getBoundingClientRect())}>Review</button></td>
      </tr>)}</tbody>
    </table>
  </div>;
}
