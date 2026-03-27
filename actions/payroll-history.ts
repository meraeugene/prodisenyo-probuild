"use server";

import { revalidatePath } from "next/cache";
import type { PayrollRow } from "@/lib/payrollEngine";
import { requireUser } from "@/lib/auth";
import { extractIsoPayrollRange } from "@/features/payroll/utils/payrollDateHelpers";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export interface SavePayrollSnapshotInput {
  attendancePeriod: string;
  availableSites: string[];
  payrollRows: PayrollRow[];
}

export interface SavePayrollSnapshotResult {
  error: string | null;
  success: boolean;
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

function getMonthLabel(start: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${start}T00:00:00.000Z`));
}

function getWeekLabel(start: string): string {
  const date = new Date(`${start}T00:00:00.000Z`);
  const weekNumber = Math.floor((date.getUTCDate() - 1) / 7) + 1;
  return `Week ${weekNumber}`;
}

function coerceSites(sites: string[]): string {
  return Array.from(
    new Set(
      sites
        .map((site) => site.trim())
        .filter(Boolean),
    ),
  ).join(", ");
}

export async function savePayrollSnapshotAction(
  input: SavePayrollSnapshotInput,
): Promise<SavePayrollSnapshotResult> {
  const user = await requireUser(["admin"]);

  if (!input.payrollRows.length) {
    return {
      error: "No payroll rows are available to save yet.",
      success: false,
    };
  }

  const parsedRange = extractIsoPayrollRange(input.attendancePeriod);
  if (!parsedRange) {
    return {
      error: "Payroll period must contain valid ISO dates before it can be saved.",
      success: false,
    };
  }

  const totalEmployees = input.payrollRows.length;
  const totalHours = roundTo2(
    input.payrollRows.reduce((sum, row) => sum + row.hoursWorked, 0),
  );
  const totalPay = roundTo2(
    input.payrollRows.reduce((sum, row) => sum + row.totalPay, 0),
  );

  const supabase = createServiceRoleSupabaseClient();
  const { data: insertedRun, error: runError } = await supabase
    .from("payroll_runs")
    .insert({
      period_label: input.attendancePeriod,
      period_start: parsedRange.start,
      period_end: parsedRange.end,
      month_label: getMonthLabel(parsedRange.start),
      week_label: getWeekLabel(parsedRange.start),
      site_scope: coerceSites(input.availableSites),
      total_employees: totalEmployees,
      total_hours: totalHours,
      total_pay: totalPay,
      saved_by: user.id,
    })
    .select("id")
    .single();

  if (runError || !insertedRun) {
    return {
      error: "Unable to save this payroll snapshot to Supabase.",
      success: false,
    };
  }

  const items = input.payrollRows.map((row) => ({
    payroll_run_id: insertedRun.id,
    employee_name: row.worker,
    employee_role: row.role,
    site: row.site,
    hours_worked: roundTo2(row.hoursWorked),
    overtime_hours: roundTo2(row.overtimeHours),
    rate_per_day: roundTo2(row.rate * 8),
    regular_pay: roundTo2(row.regularPay),
    overtime_pay: roundTo2(row.overtimePay),
    total_pay: roundTo2(row.totalPay),
  }));

  const { error: itemsError } = await supabase
    .from("payroll_run_items")
    .insert(items);

  if (itemsError) {
    await supabase.from("payroll_runs").delete().eq("id", insertedRun.id);
    return {
      error: "Payroll summary was created, but the employee rows could not be stored.",
      success: false,
    };
  }

  revalidatePath("/saved-payrolls");
  return {
    error: null,
    success: true,
  };
}
