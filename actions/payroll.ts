"use server";

import type { PayrollRunStatus } from "@/types/database";
import type { PayrollRow } from "@/lib/payrollEngine";
import type {
  PayrollOvertimeEntry,
  PayrollRowOverride,
} from "@/features/payroll/types";
import { requireRole } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  allocateCombinedBranchPay,
  FULL_WORKDAY_HOURS,
} from "@/features/payroll/utils/payrollSelectors";
import { normalizeEmployeeNameKey } from "@/features/payroll/utils/payrollMappers";

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

function normalizeLookupKey(value: string): string {
  return normalizeEmployeeNameKey(value.trim());
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

interface RequestOvertimeApprovalInput {
  attendanceImportId: string | null;
  employeeName: string;
  roleCode: string;
  siteName: string;
  attendancePeriod: string;
  overtimeEntries: PayrollOvertimeEntry[];
}

export async function requestOvertimeApprovalAction(
  input: RequestOvertimeApprovalInput,
) {
  const { user } = await requireRole("payroll_manager");
  const database = createSupabaseAdminClient() as any;
  const periodRange = parsePeriodRange(input.attendancePeriod);
  const employeeName = input.employeeName.trim();
  const siteName = normalizeSiteName(input.siteName);
  const roleCode = input.roleCode.trim().toUpperCase() || "UNKNOWN";
  const employeeNameKey = normalizeLookupKey(employeeName);
  const siteNameKey = normalizeLookupKey(siteName);
  const nextEntries = input.overtimeEntries
    .map((entry) => ({
      hours:
        Number.isFinite(entry.hours) && entry.hours > 0 ? round2(entry.hours) : 0,
      pay: Number.isFinite(entry.pay) && entry.pay > 0 ? round2(entry.pay) : 0,
      notes: entry.notes?.trim() ?? "",
    }))
    .filter((entry) => entry.hours > 0 || entry.pay > 0);

  let deleteQuery = database
    .from("payroll_adjustments")
    .delete()
    .eq("adjustment_type", "overtime")
    .eq("status", "pending")
    .eq("requested_by", user.id)
    .eq("employee_name_key", employeeNameKey)
    .eq("role_code", roleCode)
    .eq("site_name_key", siteNameKey)
    .eq("period_label", input.attendancePeriod);

  deleteQuery = input.attendanceImportId
    ? deleteQuery.eq("attendance_import_id", input.attendanceImportId)
    : deleteQuery.is("attendance_import_id", null);

  const { error: deleteError } = await deleteQuery;

  if (deleteError) {
    throw new Error("Failed to replace pending overtime requests.");
  }

  if (nextEntries.length === 0) {
    return {
      entries: [] as PayrollOvertimeEntry[],
    };
  }

  const payload = nextEntries.map((entry) => ({
    payroll_run_id: null,
    payroll_run_item_id: null,
    attendance_import_id: input.attendanceImportId,
    employee_name: employeeName,
    employee_name_key: employeeNameKey,
    role_code: roleCode,
    site_name: siteName,
    site_name_key: siteNameKey,
    period_label: input.attendancePeriod,
    period_start: periodRange.start,
    period_end: periodRange.end,
    adjustment_type: "overtime",
    status: "pending",
    requested_by: user.id,
    approved_by: null,
    effective_date: periodRange.end,
    quantity: entry.hours,
    amount: entry.pay,
    notes: entry.notes || "Overtime request",
  }));

  const { data, error } = await database
    .from("payroll_adjustments")
    .insert(payload)
    .select("id, quantity, amount, notes, status");

  if (error) {
    throw new Error("Failed to create overtime approval request.");
  }

  return {
    entries: ((data ?? []) as Array<{
      id: string;
      quantity: number;
      amount: number;
      notes: string | null;
      status: "pending" | "approved" | "rejected";
    }>).map((entry) => ({
      id: entry.id,
      requestId: entry.id,
      hours: round2(entry.quantity ?? 0),
      pay: round2(entry.amount ?? 0),
      notes: entry.notes ?? "",
      status: entry.status,
    })),
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
    const baseTotalPay = round2(Math.max(0, row.totalPay));

    return {
      row,
      override,
      cashAdvance,
      overtimePay,
      overtimeHours,
      leavePay,
      ratePerDay,
      baseTotalPay,
    };
  });

  const rowKeyLookup = new Set(
    rowSnapshots.map(
      (snapshot) =>
        `${normalizeLookupKey(snapshot.row.worker)}|||${snapshot.row.role.trim().toUpperCase()}|||${normalizeLookupKey(snapshot.row.site)}`,
    ),
  );

  let approvedOvertimeQuery = database
    .from("payroll_adjustments")
    .select(
      "id, payroll_run_id, payroll_run_item_id, employee_name_key, role_code, site_name_key, quantity, amount",
    )
    .eq("adjustment_type", "overtime")
    .eq("status", "approved")
    .eq("period_label", input.attendancePeriod);

  approvedOvertimeQuery = input.attendanceImportId
    ? approvedOvertimeQuery.eq("attendance_import_id", input.attendanceImportId)
    : approvedOvertimeQuery.is("attendance_import_id", null);

  const { data: approvedOvertimeRows, error: approvedOvertimeError } =
    await approvedOvertimeQuery;

  if (approvedOvertimeError) {
    throw createPayrollSaveError(
      "PAYROLL_SAVE_LOAD_APPROVED_OVERTIME_FAILED",
      "Failed to load approved overtime requests.",
      {
        message: approvedOvertimeError.message,
        code: approvedOvertimeError.code,
        details: approvedOvertimeError.details,
        hint: approvedOvertimeError.hint,
      },
    );
  }

  const approvedOvertimeByRowKey = new Map<
    string,
    {
      totalHours: number;
      totalPay: number;
      adjustmentIds: string[];
    }
  >();

  for (const row of (approvedOvertimeRows ?? []) as Array<{
    id: string;
    payroll_run_id: string | null;
    payroll_run_item_id: string | null;
    employee_name_key: string | null;
    role_code: string | null;
    site_name_key: string | null;
    quantity: number;
    amount: number;
  }>) {
    const rowKey = `${row.employee_name_key ?? ""}|||${row.role_code ?? ""}|||${row.site_name_key ?? ""}`;
    if (!rowKeyLookup.has(rowKey)) continue;

    const current = approvedOvertimeByRowKey.get(rowKey) ?? {
      totalHours: 0,
      totalPay: 0,
      adjustmentIds: [],
    };
    current.totalHours = round2(current.totalHours + (row.quantity ?? 0));
    current.totalPay = round2(current.totalPay + (row.amount ?? 0));
    current.adjustmentIds.push(row.id);
    approvedOvertimeByRowKey.set(rowKey, current);
  }

  const allocatedBasePayByRowId = new Map<string, number>();

  const snapshotsByEmployee = new Map<string, typeof rowSnapshots>();
  for (const snapshot of rowSnapshots) {
    const employeeKey = `${snapshot.row.role}|||${normalizeEmployeeNameKey(snapshot.row.worker)}`;
    const existing = snapshotsByEmployee.get(employeeKey);

    if (existing) {
      existing.push(snapshot);
      continue;
    }

    snapshotsByEmployee.set(employeeKey, [snapshot]);
  }

  for (const employeeSnapshots of snapshotsByEmployee.values()) {
    const allocation = allocateCombinedBranchPay(
      employeeSnapshots.map((snapshot) => ({
        site: snapshot.row.site,
        hoursWorked: snapshot.row.hoursWorked,
        dailyRatePerDay: snapshot.ratePerDay,
      })),
    );

    employeeSnapshots.forEach((snapshot, index) => {
      allocatedBasePayByRowId.set(
        snapshot.row.id,
        allocation.breakdown[index]?.basePay ?? 0,
      );
    });
  }

    const normalizedRowSnapshots = rowSnapshots.map((snapshot) => {
    const allocatedBasePay = round2(
      allocatedBasePayByRowId.get(snapshot.row.id) ?? 0,
    );
    const holidayPay = round2(
      Math.max(0, snapshot.row.regularPay - allocatedBasePay - snapshot.leavePay),
    );
    const regularPayExcludingHoliday = round2(
      Math.max(0, snapshot.row.regularPay - holidayPay),
    );

    const approvedOvertime =
      approvedOvertimeByRowKey.get(
        `${normalizeLookupKey(snapshot.row.worker)}|||${snapshot.row.role.trim().toUpperCase()}|||${normalizeLookupKey(snapshot.row.site)}`,
      ) ?? null;

    return {
      ...snapshot,
      allocatedBasePay,
      holidayPay,
      regularPayExcludingHoliday,
      approvedOvertimeHours: round2(approvedOvertime?.totalHours ?? 0),
      approvedOvertimePay: round2(approvedOvertime?.totalPay ?? 0),
      approvedOvertimeAdjustmentIds: approvedOvertime?.adjustmentIds ?? [],
    };
  });

  const grossTotal = round2(
    normalizedRowSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.row.regularPay + snapshot.approvedOvertimePay,
      0,
    ),
  );
  const netTotal = round2(
    normalizedRowSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.baseTotalPay + snapshot.approvedOvertimePay,
      0,
    ),
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

    const { error: clearItemRefsError } = await database
      .from("payroll_adjustments")
      .update({
        payroll_run_item_id: null,
      })
      .eq("payroll_run_id", runId);

    if (clearItemRefsError) {
      throw createPayrollSaveError(
        "PAYROLL_SAVE_CLEAR_ADJUSTMENT_ITEM_LINKS_FAILED",
        "Failed to reset payroll adjustment item links.",
        {
          runId,
          message: clearItemRefsError.message,
          code: clearItemRefsError.code,
          details: clearItemRefsError.details,
          hint: clearItemRefsError.hint,
        },
      );
    }

    const { error: deleteAdjustmentsError } = await database
      .from("payroll_adjustments")
      .delete()
      .eq("payroll_run_id", runId)
      .in("adjustment_type", ["paid_holiday", "cash_advance", "paid_leave"]);

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

  const payrollItemPayload = normalizedRowSnapshots.map((snapshot) => ({
    payroll_run_id: runId,
    employee_id: null,
    employee_name: snapshot.row.worker,
    role_code: snapshot.row.role,
    site_name: snapshot.row.site,
    days_worked:
      snapshot.ratePerDay > 0
        ? round2(snapshot.allocatedBasePay / snapshot.ratePerDay)
        : 0,
    hours_worked: snapshot.row.hoursWorked,
    overtime_hours: snapshot.approvedOvertimeHours,
    rate_per_day: snapshot.ratePerDay,
    regular_pay: snapshot.regularPayExcludingHoliday,
    overtime_pay: snapshot.approvedOvertimePay,
    holiday_pay: snapshot.holidayPay,
    deductions_total: snapshot.cashAdvance,
    total_pay: round2(snapshot.baseTotalPay + snapshot.approvedOvertimePay),
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
  const approvedAdjustmentRelinks: Array<{
    adjustmentIds: string[];
    payrollRunItemId: string | null;
  }> = [];

  for (const snapshot of normalizedRowSnapshots) {
    const rowKey = `${snapshot.row.role}|||${snapshot.row.worker}|||${snapshot.row.site}`.toLowerCase();
    const payrollRunItemId = itemIdByKey.get(rowKey) ?? null;

    if (snapshot.approvedOvertimeAdjustmentIds.length > 0) {
      approvedAdjustmentRelinks.push({
        adjustmentIds: snapshot.approvedOvertimeAdjustmentIds,
        payrollRunItemId,
      });
    }

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

  for (const relink of approvedAdjustmentRelinks) {
    if (relink.adjustmentIds.length === 0) continue;

    const { error: relinkError } = await database
      .from("payroll_adjustments")
      .update({
        payroll_run_id: runId,
        payroll_run_item_id: relink.payrollRunItemId,
      })
      .in("id", relink.adjustmentIds);

    if (relinkError) {
      throw createPayrollSaveError(
        "PAYROLL_SAVE_RELINK_APPROVED_OVERTIME_FAILED",
        "Failed to relink approved overtime requests.",
        {
          runId,
          adjustmentIds: relink.adjustmentIds,
          message: relinkError.message,
          code: relinkError.code,
          details: relinkError.details,
          hint: relinkError.hint,
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
      "id, payroll_run_id, payroll_run_item_id, attendance_import_id, employee_name, role_code, site_name, period_label, adjustment_type, status, quantity, amount",
    )
    .eq("id", adjustmentId)
    .single();

  if (adjustmentError || !adjustment) {
    throw new Error("Failed to load overtime request.");
  }

  if (adjustment.adjustment_type !== "overtime" || adjustment.status !== "pending") {
    throw new Error("This overtime request can no longer be updated.");
  }

  let runId: string | null = adjustment.payroll_run_id ?? null;

  if (!runId && adjustment.attendance_import_id && adjustment.period_label) {
    const { data: matchedRun } = await database
      .from("payroll_runs")
      .select("id")
      .eq("attendance_import_id", adjustment.attendance_import_id)
      .eq("period_label", adjustment.period_label)
      .neq("status", "rejected")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    runId = (matchedRun?.id as string | undefined) ?? null;
  }

  const { error: approveAdjustmentError } = await database
    .from("payroll_adjustments")
    .update({
      status: "approved",
      approved_by: user.id,
      payroll_run_id: runId,
    })
    .eq("id", adjustment.id)
    .eq("status", "pending");

  if (approveAdjustmentError) {
    throw new Error("Failed to approve overtime request.");
  }

  if (
    runId &&
    adjustment.employee_name &&
    adjustment.role_code &&
    adjustment.site_name
  ) {
    const { data: item, error: itemError } = await database
      .from("payroll_run_items")
      .select("id, overtime_hours, overtime_pay, total_pay")
      .eq("payroll_run_id", runId)
      .eq("employee_name", adjustment.employee_name)
      .eq("role_code", adjustment.role_code)
      .eq("site_name", adjustment.site_name)
      .maybeSingle();

    if (!itemError && item) {
      const { data: run, error: runError } = await database
        .from("payroll_runs")
        .select("id, gross_total, net_total")
        .eq("id", runId)
        .single();

      if (!runError && run) {
        const overtimeHours = round2(
          (item.overtime_hours ?? 0) + (adjustment.quantity ?? 0),
        );
        const overtimePay = round2(
          (item.overtime_pay ?? 0) + (adjustment.amount ?? 0),
        );
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

        const { error: linkItemError } = await database
          .from("payroll_adjustments")
          .update({
            payroll_run_item_id: item.id,
          })
          .eq("id", adjustment.id);

        if (linkItemError) {
          throw new Error("Failed to relink approved overtime request.");
        }
      }
    }
  }

  return { adjustmentId, runId, status: "approved" as const };
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
    runId: (adjustment.payroll_run_id as string | null) ?? null,
    status: "rejected" as const,
  };
}
