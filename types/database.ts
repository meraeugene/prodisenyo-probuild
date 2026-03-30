export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "ceo" | "payroll_manager";
export type PayrollRunStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected";
export type AdjustmentStatus = "pending" | "approved" | "rejected";
export type AdjustmentType =
  | "overtime"
  | "paid_holiday"
  | "cash_advance"
  | "paid_leave";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string;
          full_name: string | null;
          avatar_path: string | null;
          role: AppRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          email: string;
          full_name?: string | null;
          avatar_path?: string | null;
          role?: AppRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string;
          email?: string;
          full_name?: string | null;
          avatar_path?: string | null;
          role?: AppRole;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      sites: {
        Row: {
          id: string;
          code: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          created_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
        };
      };
      employees: {
        Row: {
          id: string;
          employee_code: string | null;
          full_name: string;
          default_role_code: string | null;
          site_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_code?: string | null;
          full_name: string;
          default_role_code?: string | null;
          site_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          employee_code?: string | null;
          full_name?: string;
          default_role_code?: string | null;
          site_id?: string | null;
          updated_at?: string;
        };
      };
      attendance_imports: {
        Row: {
          id: string;
          original_filename: string;
          site_id: string | null;
          site_name: string;
          period_label: string;
          period_start: string | null;
          period_end: string | null;
          storage_path: string | null;
          uploaded_by: string;
          raw_rows: number;
          removed_entries: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          original_filename: string;
          site_id?: string | null;
          site_name: string;
          period_label: string;
          period_start?: string | null;
          period_end?: string | null;
          storage_path?: string | null;
          uploaded_by: string;
          raw_rows?: number;
          removed_entries?: number;
          created_at?: string;
        };
        Update: {
          site_id?: string | null;
          site_name?: string;
          period_label?: string;
          period_start?: string | null;
          period_end?: string | null;
          storage_path?: string | null;
          raw_rows?: number;
          removed_entries?: number;
        };
      };
      attendance_records: {
        Row: {
          id: string;
          import_id: string;
          employee_id: string | null;
          employee_name: string;
          log_date: string;
          log_time: string;
          log_type: "IN" | "OUT";
          log_source: "Time1" | "Time2" | "OT";
          site_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          import_id: string;
          employee_id?: string | null;
          employee_name: string;
          log_date: string;
          log_time: string;
          log_type: "IN" | "OUT";
          log_source: "Time1" | "Time2" | "OT";
          site_name: string;
          created_at?: string;
        };
        Update: {
          employee_id?: string | null;
          employee_name?: string;
          log_date?: string;
          log_time?: string;
          log_type?: "IN" | "OUT";
          log_source?: "Time1" | "Time2" | "OT";
          site_name?: string;
        };
      };
      role_rates: {
        Row: {
          id: string;
          role_code: string;
          daily_rate: number;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          role_code: string;
          daily_rate: number;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role_code?: string;
          daily_rate?: number;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      employee_branch_rates: {
        Row: {
          id: string;
          employee_name: string;
          employee_name_key: string;
          role_code: string;
          site_name: string;
          site_name_key: string;
          daily_rate: number;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_name: string;
          employee_name_key: string;
          role_code: string;
          site_name: string;
          site_name_key: string;
          daily_rate: number;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          employee_name?: string;
          employee_name_key?: string;
          role_code?: string;
          site_name?: string;
          site_name_key?: string;
          daily_rate?: number;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      payroll_runs: {
        Row: {
          id: string;
          attendance_import_id: string | null;
          site_id: string | null;
          site_name: string;
          period_label: string;
          period_start: string | null;
          period_end: string | null;
          status: PayrollRunStatus;
          created_by: string;
          submitted_by: string | null;
          approved_by: string | null;
          submitted_at: string | null;
          approved_at: string | null;
          rejected_at: string | null;
          rejection_reason: string | null;
          gross_total: number;
          net_total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          attendance_import_id?: string | null;
          site_id?: string | null;
          site_name: string;
          period_label: string;
          period_start?: string | null;
          period_end?: string | null;
          status?: PayrollRunStatus;
          created_by: string;
          submitted_by?: string | null;
          approved_by?: string | null;
          submitted_at?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          gross_total?: number;
          net_total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          attendance_import_id?: string | null;
          site_id?: string | null;
          site_name?: string;
          period_label?: string;
          period_start?: string | null;
          period_end?: string | null;
          status?: PayrollRunStatus;
          submitted_by?: string | null;
          approved_by?: string | null;
          submitted_at?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          gross_total?: number;
          net_total?: number;
          updated_at?: string;
        };
      };
      payroll_run_items: {
        Row: {
          id: string;
          payroll_run_id: string;
          employee_id: string | null;
          employee_name: string;
          role_code: string;
          site_name: string;
          days_worked: number;
          hours_worked: number;
          overtime_hours: number;
          rate_per_day: number;
          regular_pay: number;
          overtime_pay: number;
          holiday_pay: number;
          deductions_total: number;
          total_pay: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          payroll_run_id: string;
          employee_id?: string | null;
          employee_name: string;
          role_code: string;
          site_name: string;
          days_worked?: number;
          hours_worked?: number;
          overtime_hours?: number;
          rate_per_day?: number;
          regular_pay?: number;
          overtime_pay?: number;
          holiday_pay?: number;
          deductions_total?: number;
          total_pay?: number;
          created_at?: string;
        };
        Update: {
          employee_id?: string | null;
          employee_name?: string;
          role_code?: string;
          site_name?: string;
          days_worked?: number;
          hours_worked?: number;
          overtime_hours?: number;
          rate_per_day?: number;
          regular_pay?: number;
          overtime_pay?: number;
          holiday_pay?: number;
          deductions_total?: number;
          total_pay?: number;
        };
      };
      payroll_run_daily_totals: {
        Row: {
          id: string;
          payroll_run_id: string;
          payroll_run_item_id: string | null;
          attendance_import_id: string | null;
          employee_name: string;
          role_code: string;
          site_name: string;
          payout_date: string;
          hours_worked: number;
          total_pay: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          payroll_run_id: string;
          payroll_run_item_id?: string | null;
          attendance_import_id?: string | null;
          employee_name: string;
          role_code: string;
          site_name: string;
          payout_date: string;
          hours_worked?: number;
          total_pay?: number;
          created_at?: string;
        };
        Update: {
          payroll_run_id?: string;
          payroll_run_item_id?: string | null;
          attendance_import_id?: string | null;
          employee_name?: string;
          role_code?: string;
          site_name?: string;
          payout_date?: string;
          hours_worked?: number;
          total_pay?: number;
        };
      };
      payroll_adjustments: {
        Row: {
          id: string;
          payroll_run_id: string | null;
          payroll_run_item_id: string | null;
          attendance_import_id: string | null;
          employee_name: string | null;
          employee_name_key: string | null;
          role_code: string | null;
          site_name: string | null;
          site_name_key: string | null;
          period_label: string | null;
          period_start: string | null;
          period_end: string | null;
          adjustment_type: AdjustmentType;
          status: AdjustmentStatus;
          requested_by: string;
          approved_by: string | null;
          effective_date: string | null;
          quantity: number;
          amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          payroll_run_id?: string | null;
          payroll_run_item_id?: string | null;
          attendance_import_id?: string | null;
          employee_name?: string | null;
          employee_name_key?: string | null;
          role_code?: string | null;
          site_name?: string | null;
          site_name_key?: string | null;
          period_label?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          adjustment_type: AdjustmentType;
          status?: AdjustmentStatus;
          requested_by: string;
          approved_by?: string | null;
          effective_date?: string | null;
          quantity?: number;
          amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          payroll_run_id?: string | null;
          payroll_run_item_id?: string | null;
          attendance_import_id?: string | null;
          employee_name?: string | null;
          employee_name_key?: string | null;
          role_code?: string | null;
          site_name?: string | null;
          site_name_key?: string | null;
          period_label?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          adjustment_type?: AdjustmentType;
          status?: AdjustmentStatus;
          approved_by?: string | null;
          effective_date?: string | null;
          quantity?: number;
          amount?: number;
          notes?: string | null;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          payload?: Json | null;
          created_at?: string;
        };
        Update: {
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          payload?: Json | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
      payroll_run_status: PayrollRunStatus;
      adjustment_status: AdjustmentStatus;
      adjustment_type: AdjustmentType;
    };
  };
}
