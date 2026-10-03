import { buildPayrollData } from "./payrollData.mjs";
import { buildProjectData } from "./projectData.mjs";
import { buildGmeaData } from "./gmeaData.mjs";

// Parents precede children. Cleanup reverses this order, including RESTRICT FKs.
export const TABLE_ORDER = [
  "sites", "role_rates", "employees", "employee_biometric_aliases", "employee_branch_rates", "employee_work_schedules", "payroll_holidays", "employee_leave_records",
  "attendance_imports", "attendance_records", "payroll_runs", "payroll_run_items", "payroll_run_daily_totals", "payroll_attendance_days", "overtime_requests", "payroll_adjustments",
  "projects", "project_documents", "budget_projects", "cost_catalog_items", "project_estimates", "project_estimate_items", "budget_items", "project_progress_activities", "project_progress_submissions", "project_progress_updates", "project_tasks", "material_requests", "purchase_orders", "workflow_evidence", "delivery_verifications", "project_material_receipts", "project_expenses", "project_closure_submissions", "workflow_notifications", "audit_logs",
  "gmea_projects", "gmea_collections", "gmea_collection_receipts", "gmea_expenses", "gmea_expense_notifications", "gmea_partners", "gmea_expense_options",
  "gmea_rental_equipment", "gmea_rental_workers", "gmea_rental_expense_categories", "gmea_rentals", "gmea_rental_items", "gmea_rental_worker_assignments", "gmea_rental_payments", "gmea_rental_expenses", "gmea_rental_expense_notifications",
];

export function buildDemoData(context) {
  return { ...buildPayrollData(context), ...buildProjectData(context), ...buildGmeaData(context) };
}
