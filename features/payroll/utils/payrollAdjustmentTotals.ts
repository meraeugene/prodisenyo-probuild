import type { PayrollCashAdvanceEntry, PayrollPaidLeaveEntry, PayrollOvertimeEntry } from "../types";

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sumCashAdvance(entries: PayrollCashAdvanceEntry[] | undefined): number {
  return round2((entries ?? []).reduce((sum, entry) => sum + entry.amount, 0));
}

export function sumOvertimePay(
  entries: PayrollOvertimeEntry[] | undefined,
  status?: "pending" | "approved" | "rejected",
): number {
  return round2(
    (entries ?? []).reduce((sum, entry) => {
      if (status && (entry.status ?? "pending") !== status) return sum;
      return sum + entry.pay;
    }, 0),
  );
}

export function sumOvertimeHours(
  entries: PayrollOvertimeEntry[] | undefined,
  status?: "pending" | "approved" | "rejected",
): number {
  return round2(
    (entries ?? []).reduce((sum, entry) => {
      if (status && (entry.status ?? "pending") !== status) return sum;
      return sum + entry.hours;
    }, 0),
  );
}

export function sumPaidLeavePay(entries: PayrollPaidLeaveEntry[] | undefined): number {
  return round2((entries ?? []).reduce((sum, entry) => sum + entry.pay, 0));
}
