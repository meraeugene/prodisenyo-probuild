import type { ProjectRecord } from "@/features/projects/types";
import type { GmeaProject } from "@/features/gmea-projects/types";
import type { GmeaRental, RentalEquipment } from "@/features/gmea-rentals/types";
import type { OvertimeRequestRecord } from "@/features/overtime-requests/types";
import type { PendingOvertimeRequest } from "@/features/payroll/utils/payrollApprovalQueueHelpers";

export const projects: ProjectRecord[] = Array.from({ length: 28 }, (_, index) => ({
  id: `project-${String(index + 1).padStart(2, "0")}`, name: index === 0 ? "Harbor Residences" : `Project ${String(index + 1).padStart(2, "0")}`,
  location: index % 2 ? "Cagayan de Oro" : "Manila", client: "Northern Development", status: index % 4 === 0 ? "planning" : index % 4 === 1 ? "active" : index % 4 === 2 ? "completed" : "on_hold",
  budget: 1100000 + index * 100000, spent: 300000 + index * 40000, progress: index % 4 === 2 ? 100 : index * 3,
  startDate: `2026-09-${String(index + 1).padStart(2, "0")}`, endDate: "2026-12-15", manager: "Maria Santos", engineer: index % 2 ? "Ana Cruz" : "Ben Ramos",
  estimateEngineer: "Liza Reyes", tasksCount: 12, completedTasksCount: 4, materialsCount: 8, description: "Construction project",
}));

export const gmeaProjects: GmeaProject[] = projects.map((project, index) => ({
  id: project.id, title: `GMEA-${String(index + 1).padStart(3, "0")}`, name: project.name, color: "#2563eb", client: index % 2 ? "Northern Development" : "Green Energy Co.", location: project.location,
  contract_amount: project.budget, tax_rate: 0, status: index % 4 === 0 ? "completed" : "active", completed_at: null, completed_by: null,
  duration: "90 days", version: 1, created_at: `${project.startDate}T08:00:00Z`, updated_at: "2026-10-07T08:00:00Z",
  expenses: [{ id: `expense-${index}`, date: "2026-09-25", description: "Materials", category: "materials", supplier: "Hardware Co.", invoice_number: "INV-1", invoice_name: "GMEA", amount: project.spent, refunded_amount: 0, vat_mode: "off", vat_rate: 0, method: "Bank", notes: "", is_new: index % 2 === 0 }],
  partners: [], payment_terms: [{ id: `term-${index}`, description: "Contract payment", value_mode: "fixed", percentage: null, amount: project.budget, notes: "",
    receipts: [{ id: `receipt-${index}`, term_id: `term-${index}`, amount: 100000, received_date: "2026-09-25", method: "Bank", reference_number: "REF-1", notes: "", status: "posted", recorded_by: "gmea", recorded_at: "2026-09-25T08:00:00Z", voided_by: null, voided_at: null, void_reason: "" }] }],
}));

export const equipment: RentalEquipment[] = projects.map((project, index) => ({
  id: project.id, name: `Excavator ${String(index + 1).padStart(2, "0")}`, code: `EQ-${index + 1}`, equipment_type: "Excavator", plate_number: `ABC ${100 + index}`,
  default_rate: 5000, rate_unit: "day", notes: "", status: index % 2 ? "on_rental" : "available", is_active: true, version: 1,
  created_at: "2026-09-01T08:00:00Z", updated_at: "2026-10-01T08:00:00Z",
}));

export const rentals: GmeaRental[] = projects.map((project, index) => ({
  id: project.id, rental_number: `R-${String(index + 1).padStart(3, "0")}`, client: index === 0 ? "Harbor Logistics" : "Northern Development", location: project.location,
  start_date: project.startDate, end_date: project.endDate, notes: "", status: index % 2 ? "active" : "completed", version: 1, created_at: "2026-09-01T08:00:00Z", updated_at: "2026-10-01T08:00:00Z", assignments: [],
  items: [{ id: `item-${index}`, equipment_id: equipment[index].id, equipment_name: equipment[index].name, rate_type: "day", unit_rate: 5000, quantity: 4, subtotal: 20000 }], payments: [],
}));

export const overtimeRequests: OvertimeRequestRecord[] = projects.map((project, index) => ({
  id: project.id, requester_role: "employee", requested_by: "employee", approved_by: null, employee_name: index === 0 ? "Juan Santos" : `Employee ${index + 1}`,
  site_name: project.location, period_label: "October 1–15", request_date: "2026-10-07", overtime_hours: 2, amount: 250, reason: "Site turnover", status: index % 2 ? "pending" : "approved",
  approved_at: null, rejected_at: null, rejection_reason: null, created_at: `${project.startDate}T08:00:00Z`, updated_at: "2026-10-07T08:00:00Z",
}));
export const payrollAdjustments: PendingOvertimeRequest[] = overtimeRequests.map((request) => ({
  id: request.id, status: request.status, payroll_run_id: null, attendance_import_id: null, employee_name: request.employee_name, role_code: "WORKER", site_name: request.site_name, period_label: request.period_label,
  quantity: request.overtime_hours, amount: request.amount, notes: "Overtime for site turnover", created_at: request.created_at, effective_date: request.request_date, period_start: "2026-10-01", period_end: "2026-10-15", payroll_runs: null, payroll_run_items: null,
}));
