import type { PayrollRunRow } from "@/features/payroll-reports/types";
import type { AttendanceRecordInput, PayrollRow } from "@/lib/payrollEngine";

export const payrollReports: PayrollRunRow[] = Array.from({ length: 28 }, (_, index) => ({
  id: `payroll-${index + 1}`, attendance_import_id: null, site_name: index % 2 ? "Cagayan de Oro" : "Manila",
  period_label: `September ${index + 1}`, period_start: "2026-09-01", period_end: "2026-09-15",
  status: index % 3 === 0 ? "approved" : index % 3 === 1 ? "submitted" : "rejected",
  gross_total: 12000 + index * 100, net_total: 11000 + index * 100, deductions_total: 1000,
  hours_worked: 80, employee_count: 2, submitted_at: `2026-09-${String(index + 1).padStart(2, "0")}T08:00:00Z`, created_at: "2026-09-01T08:00:00Z",
}));
export const payrollInsightRows: PayrollRow[] = ["Ana Cruz", "Juan Santos"].map((worker, index) => ({
  id: `employee-${index}`, worker, role: "WORKER", site: "Manila", date: "2026-09-01", hoursWorked: 80,
  overtimeHours: 2, defaultRate: 500, customRate: null, rate: 500, regularPay: 5000, overtimePay: 150, totalPay: 5150,
}));
export const payrollInsightAttendance: AttendanceRecordInput[] = payrollInsightRows.map(row => ({ name: row.worker, role: row.role, site: row.site, date: row.date, hours: 80 }));
