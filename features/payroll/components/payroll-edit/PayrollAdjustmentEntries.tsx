"use client";

import { useState } from "react";
import { PayrollDetailPagination } from "./PayrollDetailPagination";
import { Trash2 } from "lucide-react";
import type {
  PayrollAllowanceEntry,
  PayrollCashAdvanceEntry,
  PayrollDeductionEntry,
  PayrollOvertimeEntry,
  PayrollPaidLeaveEntry,
} from "@/features/payroll/types";
import { formatPeso } from "@/features/payroll/utils/payrollEditModalHelpers";
import { formatPayrollNumber } from "@/features/payroll/utils/payrollFormatters";

interface PayrollAdjustmentEntriesProps {
  cashAdvanceEntries: PayrollCashAdvanceEntry[];
  overtimeEntries: PayrollOvertimeEntry[];
  paidLeaveEntries: PayrollPaidLeaveEntry[];
  allowanceEntries: PayrollAllowanceEntry[];
  deductionEntries: PayrollDeductionEntry[];
  onRemoveCashAdvance: (id: string) => void;
  onRemoveOvertime: (id: string) => void;
  onRemovePaidLeave: (id: string) => void;
  onRemoveAllowance: (id: string) => void;
}

export function PayrollAdjustmentEntries(props: PayrollAdjustmentEntriesProps) {
  const [selectedPage, setPage] = useState(1);
  const rows = [
    ...props.cashAdvanceEntries.map((entry) => ({
      id: entry.id,
      type: "Cash Advance",
      detail: entry.notes || "Deduction",
      amount: -entry.amount,
      removable: true,
      remove: () => props.onRemoveCashAdvance(entry.id),
    })),
    ...props.overtimeEntries.map((entry) => ({
      id: entry.id,
      type: "Overtime",
      detail:
        entry.notes ||
        `${formatPayrollNumber(entry.hours)} hours - ${entry.status ?? "pending"}`,
      amount: entry.pay,
      removable: entry.status !== "approved",
      remove: () => props.onRemoveOvertime(entry.id),
    })),
    ...props.paidLeaveEntries.map((entry) => ({
      id: entry.id,
      type: "Paid Leave",
      detail: entry.notes || `${formatPayrollNumber(entry.days)} days`,
      amount: entry.pay,
      removable: true,
      remove: () => props.onRemovePaidLeave(entry.id),
    })),
    ...props.allowanceEntries.map((entry) => ({
      id: entry.id,
      type: "Allowance",
      detail: entry.notes || "Additional pay",
      amount: entry.amount,
      removable: true,
      remove: () => props.onRemoveAllowance(entry.id),
    })),
    ...props.deductionEntries.map((entry) => ({
      id: entry.id,
      type: "Reductions",
      detail: "Government and other deductions",
      amount: -(
        entry.sssGsis +
        entry.philHealth +
        entry.pagIbig +
        entry.withholdingTax +
        entry.otherDeductions
      ),
      removable: false,
      remove: () => undefined,
    })),
  ];

  const totalPages = Math.max(1, Math.ceil(rows.length / 2));
  const page = Math.min(selectedPage, totalPages);
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-10 items-center justify-between gap-3 border-b border-slate-200 px-3.5">
        <div className="flex items-center gap-2 text-[13px] font-medium text-slate-950">
          Adjustment Entries
        </div>
        <span className="text-[13px] font-medium text-slate-400">
          {rows.length} entr{rows.length === 1 ? "y" : "ies"}
        </span>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-5 text-center text-[13px] text-slate-500">
          No manual adjustments recorded.
        </div>
      ) : (
        <div className="grid divide-y divide-slate-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          {rows.slice((page - 1) * 2, page * 2).map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-3.5 py-2 text-[13px] odd:border-b odd:border-slate-100 lg:odd:border-b-0"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{entry.type}</p>
                <p className="truncate text-[13px] text-slate-400">{entry.detail}</p>
              </div>
              <span
                className={`tabular-nums text-[13px] font-medium ${entry.amount < 0 ? "text-red-600" : "text-teal-700"}`}
              >
                {entry.amount < 0 ? "-" : "+"}
                {formatPeso(Math.abs(entry.amount))}
              </span>
              <button
                type="button"
                onClick={entry.remove}
                disabled={!entry.removable}
                aria-label={`Remove ${entry.type}`}
                className="grid h-9 w-9 place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:invisible"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      <PayrollDetailPagination page={page} totalPages={totalPages} onChange={setPage} />
    </section>
  );
}
