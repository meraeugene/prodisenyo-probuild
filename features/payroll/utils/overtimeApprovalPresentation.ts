import { getRelationValue, type PendingOvertimeRequest } from "./payrollApprovalQueueHelpers";
import { parseOvertimeRequestNotes } from "./overtimeRequestNotes";

export function getPayrollApprovalLabels(request: PendingOvertimeRequest) {
  const run = getRelationValue(request.payroll_runs);
  const notes = parseOvertimeRequestNotes(request.notes);
  return {
    employee: request.employee_name?.trim() || "Unknown employee",
    site: run?.site_name?.trim() || request.site_name?.trim() || "Unknown site",
    period: run?.period_label || request.period_label || "Unknown period",
    notes: notes.displayNotes,
    rejectionReason: notes.rejectionReason,
  };
}
