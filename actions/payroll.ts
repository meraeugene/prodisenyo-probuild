"use server";

import type { PayrollRunStatus } from "@/types/database";
import type { PayrollRow } from "@/lib/payrollEngine";
import type { PayrollRowOverride } from "@/features/payroll/types";
import { requireRole } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  FULL_WORKDAY_HOURS,
  computeBasePay,
  computeDaysWorked,
} from "@/features/payroll/utils/payrollSelectors";

interface SavePayrollRunInput {
  attendanceImportId: string | null;
  payrollRunId: string | null;
  siteName: string;
  attendancePeriod: string;
  payrollRows: PayrollRow[];
  payrollOverrides: Record<string, PayrollRowOverride>;
}

function createPayrollSaveError(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): Error {
  const suffix = details ? ` | ${JSON.stringify(details)}` : "";
  return new Error(`[${code}] ${message}${suffix}`);
}

function parsePeriodRange(label: string): { start: string | null; end: string | null } {
  const match = label.match(/(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/);
  if (!match) return { start: null, end: null };

  return {
    start: match[1] ?? null,
    end: match[2] ?? null,
  };
}

function normalizeSiteName(value: string): string {
  return value.trim() || "Unknown Site";
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function computeRowAdjustmentTotals(override: PayrollRowOverride | undefined) {
  const cashAdvance = round2(
    Number.isFinite(override?.cashAdvanceTotal)
      ? override?.cashAdvanceTotal ?? 0
      : (override?.cashAdvanceEntries ?? []).reduce(
          (sum, entry) => sum + entry.amount,
          0,
        ),
  );
  const overtimePay = round2(
    Number.isFinite(override?.overtimeEntriesPayTotal)
      ? override?.overtimeEntriesPayTotal ?? 0
      : (override?.overtimeEntries ?? []).reduce((sum, entry) => sum + entry.pay, 0),
  );
  const overtimeHours = round2(
    Number.isFinite(override?.overtimeEntriesHoursTotal)
      ? override?.overtimeEntriesHoursTotal ?? 0
      : (override?.overtimeEntries ?? []).reduce((sum, entry) => sum + entry.hours, 0),
  );
  const leavePay = round2(
    Number.isFinite(override?.paidLeaveEntriesPayTotal)
      ? override?.paidLeaveEntriesPayTotal ?? 0
      : (override?.paidLeaveEntries ?? []).reduce((sum, entry) => sum + entry.pay, 0),
  );

  return {
    cashAdvance,
    overtimePay,
    overtimeHours,
    leavePay,
  };
}

export async function savePayrollRunAction(input: SavePayrollRunInput) {
  const { user } = await requireRole(["ceo", "payroll_manager"]);
  const database = createSupabaseAdminClient() as any;
  const periodRange = parsePeriodRange(input.attendancePeriod);

  if (input.payrollRows.length === 0) {
    throw createPayrollSaveError("PAYROLL_SAVE_NO_ROWS", "No payroll rows to save.", {
      attendanceImportId: input.attendanceImportId,
      payrollRunId: input.payrollRunId,
      attendancePeriod: input.attendancePeriod,
    });
  }

  if (!input.attendancePeriod.trim()) {
    throw createPayrollSaveError(
      "PAYROLL_SAVE_NO_PERIOD",
      "Attendance period is required before saving payroll.",
    );
  }

  const { data: siteData } = await database
    .from("sites")
    .select("id")
    .eq("name", normalizeSiteName(input.siteName))
    .maybeSingle();
  const site = (siteData ?? null) as { id: string } | null;

  const rowSnapshots = input.payrollRows.map((row) => {
    const override = input.payrollOverrides[row.id];
    const { cashAdvance, overtimePay, overtimeHours, leavePay } =
      computeRowAdjustmentTotals(override);
    const ratePerDay = round2((row.customRate ?? row.defaultRate) * FULL_WORKDAY_HOURS);
    const holidayPay = round2(
      Math.max(0, row.regularPay - computeBasePay(row.hoursWorked, ratePerDay) - leavePay),
    );
    const baseTotalPay = round2(Math.max(0, row.totalPay - overtimePay));
    const regularPayExcludingHoliday = round2(
      Math.max(0, row.regularPay - holidayPay),
    );

    return {
      row,
      override,
      cashAdvance,
      overtimePay,
      overtimeHours,
      leavePay,
      holidayPay,
      ratePerDay,
      baseTotalPay,
      regularPayExcludingHoliday,
    };
  });

  const grossTotal = round2(
    rowSnapshots.reduce((sum, snapshot) => sum + snapshot.row.regularPay, 0),
  );
  const netTotal = round2(
    rowSnapshots.reduce((sum, snapshot) => sum + snapshot.baseTotalPay, 0),
  );

  let runId = input.payrollRunId;

  if (runId) {
    const { error: updateRunError } = await database
      .from("payroll_runs")
      .update({
        attendance_import_id: input.attendanceImportId,
        site_id: site?.id ?? null,
        site_name: normalizeSiteName(input.siteName),
        period_label: input.attendancePeriod,
        period_start: periodRange.start,
        period_end: periodRange.end,
        status: "submitted" satisfies PayrollRunStatus,
        submitted_by: user.id,
        submitted_at: new Date().toISOString(),
        gross_total: grossTotal,
        net_total: netTotal,
      })
      .eq("id", runId);

    if (updateRunError) {
      throw createPayrollSaveError(
        "PAYROLL_SAVE_UPDATE_RUN_FAILED",
        "Failed to update payroll run.",
        {
          runId,
          message: updateRunError.message,
          code: updateRunError.code,
          details: updateRunError.details,
          hint: updateRunError.hint,
        },
      );
    }

    const { error: deleteAdjustmentsError } = await database
      .from("payroll_adjustments")
      .delete()
      .eq("payroll_run_id", runId);

    if (deleteAdjustmentsError) {
      throw createPayrollSaveError(
        "PAYROLL_SAVE_CLEAR_ADJUSTMENTS_FAILED",
        "Failed to replace payroll adjustments.",
        {
          runId,
          message: deleteAdjustmentsError.message,
          code: deleteAdjustmentsError.code,
          details: deleteAdjustmentsError.details,
          hint: deleteAdjustmentsError.hint,
        },
      );
    }

    const { error: deleteItemsError } = await database
      .from("payroll_run_items")
      .delete()
      .eq("payroll_run_id", runId);

    if (deleteItemsError) {
      throw createPayrollSaveError(
        "PAYROLL_SAVE_CLEAR_ITEMS_FAILED",
        "Failed to replace payroll items.",
        {
          runId,
          message: deleteItemsError.message,
          code: deleteItemsError.code,
          details: deleteItemsError.details,
          hint: deleteItemsError.hint,
        },
      );
    }
  } else {
    const { data: payrollRun, error: payrollRunError } = await database
      .from("payroll_runs")
      .insert({
        attendance_import_id: input.attendanceImportId,
        site_id: site?.id ?? null,
        site_name: normalizeSiteName(input.siteName),
        period_label: input.attendancePeriod,
        period_start: periodRange.start,
        period_end: periodRange.end,
        status: "submitted" satisfies PayrollRunStatus,
        created_by: user.id,
        submitted_by: user.id,
        submitted_at: new Date().toISOString(),
        gross_total: grossTotal,
        net_total: netTotal,
      })
      .select("id")
      .single();

    if (payrollRunError || !payrollRun) {
      throw createPayrollSaveError(
        "PAYROLL_SAVE_CREATE_RUN_FAILED",
        "Failed to save payroll run.",
        {
          attendanceImportId: input.attendanceImportId,
          siteName: normalizeSiteName(input.siteName),
          attendancePeriod: input.attendancePeriod,
          message: payrollRunError?.message ?? "No row returned",
          code: payrollRunError?.code,
          details: payrollRunError?.details,
          hint: payrollRunError?.hint,
        },
      );
    }

    runId = payrollRun.id as string;
  }

  const payrollItemPayload = rowSnapshots.map((snapshot) => ({
    payroll_run_id: runId,
    employee_id: null,
    employee_name: snapshot.row.worker,
    role_code: snapshot.row.role,
    site_name: snapshot.row.site,
    days_worked: computeDaysWorked(snapshot.row.hoursWorked),
    hours_worked: snapshot.row.hoursWorked,
    overtime_hours: 0,
    rate_per_day: snapshot.ratePerDay,
    regular_pay: snapshot.regularPayExcludingHoliday,
    overtime_pay: 0,
    holiday_pay: snapshot.holidayPay,
    deductions_total: snapshot.cashAdvance,
    total_pay: snapshot.baseTotalPay,
  }));

  const { data: insertedItems, error: itemsError } = await database
    .from("payroll_run_items")
    .insert(payrollItemPayload)
    .select("id, employee_name, role_code, site_name");

  if (itemsError) {
    throw createPayrollSaveError(
      "PAYROLL_SAVE_ITEMS_FAILED",
      "Failed to save payroll items.",
      {
        runId,
        itemCount: payrollItemPayload.length,
        message: itemsError.message,
        code: itemsError.code,
        details: itemsError.details,
        hint: itemsError.hint,
      },
    );
  }

  const itemIdByKey = new Map<string, string>(
    ((insertedItems ?? []) as Array<{
      id: string;
      employee_name: string;
      role_code: string;
      site_name: string;
    }>).map((item) => [
      `${item.role_code}|||${item.employee_name}|||${item.site_name}`.toLowerCase(),
      item.id,
    ]),
  );

  const adjustmentPayload: Array<Record<string, unknown>> = [];

  for (const snapshot of rowSnapshots) {
    const rowKey = `${snapshot.row.role}|||${snapshot.row.worker}|||${snapshot.row.site}`.toLowerCase();
    const payrollRunItemId = itemIdByKey.get(rowKey) ?? null;

    if (snapshot.holidayPay > 0) {
      adjustmentPayload.push({
        payroll_run_id: runId,
        payroll_run_item_id: payrollRunItemId,
        adjustment_type: "paid_holiday",
        status: "approved",
        requested_by: user.id,
        approved_by: user.id,
        effective_date: periodRange.end,
        quantity: Number(
          (
            snapshot.ratePerDay > 0
              ? snapshot.holidayPay / snapshot.ratePerDay
              : 1
          ).toFixed(2),
        ),
        amount: snapshot.holidayPay,
        notes: "Saved with payroll",
      });
    }

    if (snapshot.cashAdvance > 0) {
      adjustmentPayload.push({
        payroll_run_id: runId,
        payroll_run_item_id: payrollRunItemId,
        adjustment_type: "cash_advance",
        status: "approved",
        requested_by: user.id,
        approved_by: user.id,
        effective_date: periodRange.end,
        quantity: 1,
        amount: snapshot.cashAdvance,
        notes: "Saved with payroll",
      });
    }

    if (snapshot.leavePay > 0) {
      adjustmentPayload.push({
        payroll_run_id: runId,
        payroll_run_item_id: payrollRunItemId,
        adjustment_type: "paid_leave",
        status: "approved",
        requested_by: user.id,
        approved_by: user.id,
        effective_date: periodRange.end,
        quantity: 1,
        amount: snapshot.leavePay,
        notes: "Saved with payroll",
      });
    }

    for (const entry of snapshot.override?.overtimeEntries ?? []) {
      adjustmentPayload.push({
        payroll_run_id: runId,
        payroll_run_item_id: payrollRunItemId,
        adjustment_type: "overtime",
        status: "pending",
        requested_by: user.id,
        effective_date: periodRange.end,
        quantity: entry.hours,
        amount: entry.pay,
        notes: entry.notes || "Overtime request",
      });
    }
  }

  if (adjustmentPayload.length > 0) {
    const { error: adjustmentError } = await database
      .from("payroll_adjustments")
      .insert(adjustmentPayload);

    if (adjustmentError) {
      throw createPayrollSaveError(
        "PAYROLL_SAVE_ADJUSTMENTS_FAILED",
        "Failed to save payroll adjustments.",
        {
          runId,
          adjustmentCount: adjustmentPayload.length,
          message: adjustmentError.message,
          code: adjustmentError.code,
          details: adjustmentError.details,
          hint: adjustmentError.hint,
        },
      );
    }
  }

  return {
    runId,
    status: "submitted" as PayrollRunStatus,
  };
}

export async function approveOvertimeAdjustmentAction(adjustmentId: string) {
  const { user } = await requireRole("ceo");
  const database = createSupabaseAdminClient() as any;

  const { data: adjustment, error: adjustmentError } = await database
    .from("payroll_adjustments")
    .select(
      "id, payroll_run_id, payroll_run_item_id, adjustment_type, status, quantity, amount",
    )
    .eq("id", adjustmentId)
    .single();

  if (adjustmentError || !adjustment) {
    throw new Error("Failed to load overtime request.");
  }

  if (adjustment.adjustment_type !== "overtime" || adjustment.status !== "pending") {
    throw new Error("This overtime request can no longer be updated.");
  }

  const { data: item, error: itemError } = await database
    .from("payroll_run_items")
    .select("id, overtime_hours, overtime_pay, total_pay")
    .eq("id", adjustment.payroll_run_item_id)
    .single();

  if (itemError || !item) {
    throw new Error("Failed to load payroll item for overtime request.");
  }

  const { data: run, error: runError } = await database
    .from("payroll_runs")
    .select("id, gross_total, net_total")
    .eq("id", adjustment.payroll_run_id)
    .single();

  if (runError || !run) {
    throw new Error("Failed to load payroll run for overtime request.");
  }

  const overtimeHours = round2((item.overtime_hours ?? 0) + (adjustment.quantity ?? 0));
  const overtimePay = round2((item.overtime_pay ?? 0) + (adjustment.amount ?? 0));
  const totalPay = round2((item.total_pay ?? 0) + (adjustment.amount ?? 0));
  const grossTotal = round2((run.gross_total ?? 0) + (adjustment.amount ?? 0));
  const netTotal = round2((run.net_total ?? 0) + (adjustment.amount ?? 0));

  const { error: updateItemError } = await database
    .from("payroll_run_items")
    .update({
      overtime_hours: overtimeHours,
      overtime_pay: overtimePay,
      total_pay: totalPay,
    })
    .eq("id", item.id);

  if (updateItemError) {
    throw new Error("Failed to update payroll item overtime totals.");
  }

  const { error: updateRunError } = await database
    .from("payroll_runs")
    .update({
      gross_total: grossTotal,
      net_total: netTotal,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", run.id);

  if (updateRunError) {
    throw new Error("Failed to update payroll run totals.");
  }

  const { error: approveAdjustmentError } = await database
    .from("payroll_adjustments")
    .update({
      status: "approved",
      approved_by: user.id,
    })
    .eq("id", adjustment.id)
    .eq("status", "pending");

  if (approveAdjustmentError) {
    throw new Error("Failed to approve overtime request.");
  }

  return { adjustmentId, runId: run.id, status: "approved" as const };
}

export async function rejectOvertimeAdjustmentAction(adjustmentId: string) {
  const { user } = await requireRole("ceo");
  const database = createSupabaseAdminClient() as any;

  const { data: adjustment, error: adjustmentError } = await database
    .from("payroll_adjustments")
    .select("id, payroll_run_id, adjustment_type, status")
    .eq("id", adjustmentId)
    .single();

  if (adjustmentError || !adjustment) {
    throw new Error("Failed to load overtime request.");
  }

  if (adjustment.adjustment_type !== "overtime" || adjustment.status !== "pending") {
    throw new Error("This overtime request can no longer be updated.");
  }

  const { error } = await database
    .from("payroll_adjustments")
    .update({
      status: "rejected",
      approved_by: user.id,
    })
    .eq("id", adjustmentId)
    .eq("status", "pending");

  if (error) {
    throw new Error("Failed to reject overtime request.");
  }

  return {
    adjustmentId,
    runId: adjustment.payroll_run_id as string,
    status: "rejected" as const,
  };
}
