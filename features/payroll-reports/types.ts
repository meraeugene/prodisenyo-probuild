import type { DailyLogRow } from "@/types";
import type { Database, PayrollRunStatus } from "@/types/database";

export type PayrollRunRow = Pick<
  Database["public"]["Tables"]["payroll_runs"]["Row"],
  | "id"
  | "attendance_import_id"
  | "site_name"
  | "period_label"
  | "period_start"
  | "period_end"
  | "status"
  | "net_total"
  | "created_at"
  | "submitted_at"
>;

export type PayrollRunItemRow = Pick<
  Database["public"]["Tables"]["payroll_run_items"]["Row"],
  | "id"
  | "employee_name"
  | "role_code"
  | "site_name"
  | "days_worked"
  | "hours_worked"
  | "overtime_hours"
  | "rate_per_day"
  | "regular_pay"
  | "overtime_pay"
  | "holiday_pay"
  | "deductions_total"
  | "total_pay"
>;

export type AttendanceLogRow = Pick<
  Database["public"]["Tables"]["attendance_records"]["Row"],
  | "id"
  | "employee_name"
  | "log_date"
  | "log_time"
  | "log_type"
  | "log_source"
  | "site_name"
>;

export type PayrollRunDailyTotalRow = Pick<
  Database["public"]["Tables"]["payroll_run_daily_totals"]["Row"],
  | "id"
  | "payroll_run_item_id"
  | "employee_name"
  | "role_code"
  | "site_name"
  | "payout_date"
  | "hours_worked"
  | "total_pay"
>;

export interface ReportDetailsState {
  loading: boolean;
  error: string | null;
  payrollItems: PayrollRunItemRow[];
  attendanceLogs: AttendanceLogRow[];
  dailyTotals: PayrollRunDailyTotalRow[];
}

export interface ReportActionsMenuState {
  runId: string;
  top: number;
  left: number;
}

export interface ReportSiteSummary {
  siteName: string;
  employees: number;
  payroll: number;
  hours: number;
}

export interface ReportTrendPoint {
  date: string;
  label: string;
  paid: number;
  hours: number;
  employees: number;
}

export interface ReportCompositionDatum {
  name: string;
  value: number;
  color: string;
}

export interface EmployeeAttendanceModalData {
  dailyRows: DailyLogRow[];
  scopedDailyTotals: Array<{
    id: string;
    payout_date: string;
    hours_worked: number;
    total_pay: number;
  }>;
  attendanceDays: number;
  inLogs: number;
  outLogs: number;
  otLogs: number;
}

export type PayrollStatus = PayrollRunStatus;
