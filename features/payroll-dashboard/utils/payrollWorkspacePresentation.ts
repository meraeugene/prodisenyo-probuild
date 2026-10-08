import type { PayrollDashboardRunStatus, PayrollWorkspaceRun } from "../types";
export const PAYROLL_STATUS_LABELS: Record<PayrollDashboardRunStatus, string> = {
  draft: "Drafts", submitted: "Awaiting CEO", approved: "Approved", rejected: "Returned",
};
export function payrollRunHref(run: PayrollWorkspaceRun) {
  if ((run.status === "draft" || run.status === "rejected") && run.attendanceImportId) {
    return `/generate-payroll?${new URLSearchParams({ importId: run.attendanceImportId, runId: run.id })}`;
  }
  return `/payroll-analytics?runId=${encodeURIComponent(run.id)}`;
}
