import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { PayrollRow } from "@/lib/payrollEngine";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { normalizeEmployeeNameKey } from "../utils/payrollMappers";
import { FULL_WORKDAY_HOURS } from "../utils/payrollSelectors";
import { round2, sumCashAdvance, sumPaidLeavePay, sumOvertimePay, sumOvertimeHours } from "../utils/payrollAdjustmentTotals";
import type { PayrollRowOverride, PayrollCashAdvanceEntry, PayrollPaidLeaveEntry, PayrollOvertimeEntry, PayrollAllowanceEntry, PayrollDeductionEntry } from "../types";

type Props = { currentPayrollRunId: string | null; payrollBaseRows: PayrollRow[]; setPayrollOverrides: Dispatch<SetStateAction<Record<string, PayrollRowOverride>>> };

export function useSavedPayrollDraft({ currentPayrollRunId, payrollBaseRows, setPayrollOverrides }: Props) {
  const restoredPayrollRunIdRef = useRef<string | null>(null);
  const [settledRunId, setSettledRunId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const resetSavedDraft = useCallback(() => {
    restoredPayrollRunIdRef.current = null;
    setSettledRunId(null);
    setLoadError(null);
    setRestoreAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    const payrollRunId = currentPayrollRunId;
    if (
      !payrollRunId ||
      payrollBaseRows.length === 0 ||
      restoredPayrollRunIdRef.current === payrollRunId
    ) {
      return;
    }

    let cancelled = false;
    setLoadError(null);

    async function restoreSavedPayrollDraft() {
      if (!payrollRunId) return;

      try {
        const supabase = createSupabaseBrowserClient();
        const { data: itemsData, error: itemsError } = await supabase
          .from("payroll_run_items")
          .select(
            "id, employee_name, role_code, site_name, hours_worked, overtime_hours, rate_per_day, holiday_pay, deductions_total",
          )
          .eq("payroll_run_id", payrollRunId);

        if (cancelled) return;
        if (itemsError) throw itemsError;

        const savedItems = (itemsData ?? []) as Array<{
          id: string;
          employee_name: string;
          role_code: string;
          site_name: string;
          hours_worked: number;
          overtime_hours: number;
          rate_per_day: number;
          holiday_pay: number;
          deductions_total: number;
        }>;
        const savedItemIds = savedItems.map((item) => item.id);
        const { data: adjustmentsData, error: adjustmentsError } =
          savedItemIds.length > 0
            ? await supabase
                .from("payroll_adjustments")
                .select(
                  "id, payroll_run_item_id, adjustment_type, status, quantity, amount, notes",
                )
                .eq("payroll_run_id", payrollRunId)
                .in("payroll_run_item_id", savedItemIds)
            : { data: [], error: null };

        if (cancelled) return;
        if (adjustmentsError) throw adjustmentsError;

        const savedAdjustments = (adjustmentsData ?? []) as Array<{
          id: string;
          payroll_run_item_id: string | null;
          adjustment_type:
            | "overtime"
            | "paid_holiday"
            | "cash_advance"
            | "paid_leave";
          status: "pending" | "approved" | "rejected";
          quantity: number;
          amount: number;
          notes: string | null;
        }>;

        setPayrollOverrides((previous) => {
          const next = { ...previous };

          for (const item of savedItems) {
            const row = payrollBaseRows.find(
              (candidate) =>
                normalizeEmployeeNameKey(candidate.worker) ===
                  normalizeEmployeeNameKey(item.employee_name) &&
                candidate.role.trim().toUpperCase() ===
                  item.role_code.trim().toUpperCase() &&
                normalizeEmployeeNameKey(candidate.site) ===
                  normalizeEmployeeNameKey(item.site_name),
            );

            if (!row) continue;

            const itemAdjustments = savedAdjustments.filter(
              (adjustment) => adjustment.payroll_run_item_id === item.id,
            );
            const cashAdvanceEntries = itemAdjustments
              .filter((adjustment) => adjustment.adjustment_type === "cash_advance")
              .map<PayrollCashAdvanceEntry>((adjustment) => ({
                id: adjustment.id,
                amount: round2(Number(adjustment.amount ?? 0)),
                notes: adjustment.notes ?? "Restored from saved draft",
              }));
            const paidLeaveEntries = itemAdjustments
              .filter((adjustment) => adjustment.adjustment_type === "paid_leave")
              .map<PayrollPaidLeaveEntry>((adjustment) => ({
                id: adjustment.id,
                days: round2(Number(adjustment.quantity ?? 0)),
                pay: round2(Number(adjustment.amount ?? 0)),
                notes: adjustment.notes ?? "Restored from saved draft",
              }));
            const overtimeEntries = itemAdjustments
              .filter((adjustment) => adjustment.adjustment_type === "overtime")
              .map<PayrollOvertimeEntry>((adjustment) => ({
                id: adjustment.id,
                requestId: adjustment.id,
                hours: round2(Number(adjustment.quantity ?? 0)),
                pay: round2(Number(adjustment.amount ?? 0)),
                notes: adjustment.notes ?? "",
                status: adjustment.status,
              }));
            const cashAdvanceTotal = sumCashAdvance(cashAdvanceEntries);
            const paidLeaveTotal = sumPaidLeavePay(paidLeaveEntries);
            const restoredAllowance = Math.max(
              0,
              round2(Number(item.holiday_pay ?? 0) - paidLeaveTotal),
            );
            const allowanceEntries: PayrollAllowanceEntry[] =
              restoredAllowance > 0
                ? [
                    {
                      id: `restored-${item.id}`,
                      amount: restoredAllowance,
                      notes: "Restored saved holiday and allowance pay",
                    },
                  ]
                : [];
            const deductionsTotal = round2(
              Number(item.deductions_total ?? 0),
            );
            const deductionEntries: PayrollDeductionEntry[] =
              deductionsTotal > 0
                ? [
                    {
                      id: `restored-${item.id}`,
                      sssGsis: 0,
                      philHealth: 0,
                      pagIbig: 0,
                      withholdingTax: 0,
                      otherDeductions: deductionsTotal,
                    },
                  ]
                : [];
            const approvedOvertimeHours = sumOvertimeHours(
              overtimeEntries,
              "approved",
            );
            const biometricOvertimeHours = Math.max(
              0,
              round2(
                Number(item.overtime_hours ?? 0) - approvedOvertimeHours,
              ),
            );

            next[row.id] = {
              ...previous[row.id],
              date: previous[row.id]?.date ?? row.date,
              hoursWorked: round2(Number(item.hours_worked ?? 0)),
              overtimeHours: round2(Number(item.overtime_hours ?? 0)),
              customRate:
                Number(item.rate_per_day ?? 0) > 0
                  ? round2(Number(item.rate_per_day) / FULL_WORKDAY_HOURS)
                  : row.customRate ?? null,
              cashAdvanceEntries,
              cashAdvanceTotal,
              paidLeaveEntries,
              paidLeaveEntriesPayTotal: paidLeaveTotal,
              allowanceEntries,
              allowanceEntriesTotal: restoredAllowance,
              deductionEntries,
              deductionsTotal,
              overtimeEntries,
              overtimeEntriesPayTotal: sumOvertimePay(
                overtimeEntries,
                "approved",
              ),
              overtimeEntriesHoursTotal: approvedOvertimeHours,
              biometricOvertimeHours,
              biometricOvertimeStatus:
                biometricOvertimeHours > 0 ? "approved" : null,
            };
          }

          return next;
        });
        restoredPayrollRunIdRef.current = payrollRunId;
      } catch {
        if (!cancelled) setLoadError("Unable to load saved payroll adjustments. Please try again.");
      } finally {
        if (!cancelled) setSettledRunId(payrollRunId);
      }
    }

    void restoreSavedPayrollDraft();

    return () => {
      cancelled = true;
    };
  }, [currentPayrollRunId, payrollBaseRows, setPayrollOverrides, restoreAttempt]);

  return {
    isRestoringSavedDraft: Boolean(currentPayrollRunId && payrollBaseRows.length > 0 && settledRunId !== currentPayrollRunId),
    savedDraftLoadError: currentPayrollRunId === settledRunId ? loadError : null,
    resetSavedDraft,
  };
}
