"use client";

import { useState } from "react";
import { PayrollDetailPagination } from "./PayrollDetailPagination";
import {
  Check,
  Plus,
  X,
} from "lucide-react";
import type { AdjustmentFormType } from "@/features/payroll/utils/payrollEditModalHelpers";
import {
  formatPeso,
} from "@/features/payroll/utils/payrollEditModalHelpers";
import { formatPayrollNumber } from "@/features/payroll/utils/payrollFormatters";

interface BranchRateRow {
  site: string;
  hours: number;
  payableDays: number;
  ratePerDay: number;
}

interface PayrollCalculationSidebarProps {
  panel: string;
  attendanceDays: number;
  daysWorked: number;
  actualWorkedHours: number;
  regularWorkedHours: number;
  overtimeHours: number;
  baseWorkedPay: number;
  overtimePay: number;
  grossPay: number;
  adjustedTotalPay: number;
  adjustmentTotal: number;
  hasBiometricOvertime: boolean;
  biometricOvertimeHours: number;
  biometricOvertimeStatus: "approved" | "rejected" | null;
  branchRates: BranchRateRow[];
  showBranchRates: boolean;
  isPayrollManager: boolean;
  onToggleBranchRates: () => void;
  onOpenAdjustment: (form: Exclude<AdjustmentFormType, null>) => void;
  onBiometricDecision: (status: "approved" | "rejected") => void;
}

export function PayrollCalculationSidebar(props: PayrollCalculationSidebarProps) {
  const [selectedPage, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(props.branchRates.length / 5));
  const page = Math.min(selectedPage, totalPages);
  const summaryRows = [
    ["Attendance", `${props.attendanceDays} days`],
    ["Days Worked", `${props.daysWorked} days`],
    ["Actual Hours", `${formatPayrollNumber(props.actualWorkedHours)} hrs`],
    ["Regular Hours", `${formatPayrollNumber(props.regularWorkedHours)} hrs`],
    ["OT Hours", `${formatPayrollNumber(props.overtimeHours)} hrs`],
    ["Service Pay", formatPeso(props.baseWorkedPay)],
    ["OT Pay", formatPeso(props.overtimePay)],
    ["Gross Pay", formatPeso(props.grossPay)],
    ["Adjustments", formatPeso(props.adjustmentTotal)],
  ];
  const actions: Array<[Exclude<AdjustmentFormType, null>, string]> = [
    ["cashAdvance", "Cash Advance"],
    ["overtime", "Overtime"],
    ["paidLeave", "Paid Leave"],
    ["allowance", "Allowance"],
    ...(props.isPayrollManager
      ? ([["reductions", "Reductions"]] as Array<[
          Exclude<AdjustmentFormType, null>,
          string,
        ]>)
      : []),
  ];

  return (
    <aside className="space-y-3">
      {props.panel === "summary" ? <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-3.5 py-2.5">
          <h3 className="text-[13px] font-semibold">Calculation Summary</h3>
        </div>
        <div className="grid grid-cols-2">
          {summaryRows.map(([label, value], index) => (
            <div
              key={label}
              className={`flex items-center justify-between gap-2 border-slate-100 px-3 py-2 text-[13px] ${
                index % 2 === 0 ? "border-r" : ""
              } ${index < summaryRows.length - 2 ? "border-b" : ""}`}
            >
              <span className="text-slate-500">{label}</span>
              <span className="text-right tabular-nums font-medium text-slate-900">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between bg-teal-50 px-3.5 py-2.5">
          <span className="text-[13px] font-medium text-teal-900">Adjusted Total Pay</span>
          <span className="tabular-nums text-base font-medium text-teal-700">
            {formatPeso(props.adjustedTotalPay)}
          </span>
        </div>
      </section> : null}

      {props.panel === "biometric" && props.hasBiometricOvertime ? (
        <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <h3 className="text-[13px] font-semibold">Biometric OT Decision</h3>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-md bg-amber-50 px-2 py-1.5 text-[13px] font-medium text-amber-700">
              {formatPayrollNumber(props.biometricOvertimeHours)} hrs{" "}
              {props.biometricOvertimeStatus ?? "pending confirmation"}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => props.onBiometricDecision("approved")}
                className="inline-flex h-9 items-center gap-1 rounded-md border border-teal-200 px-2.5 text-[13px] font-medium text-teal-700 hover:bg-teal-50"
              >
                <Check size={12} /> Confirm
              </button>
              <button
                type="button"
                onClick={() => props.onBiometricDecision("rejected")}
                className="inline-flex h-9 items-center gap-1 rounded-md border border-red-200 px-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50"
              >
                <X size={12} /> Exclude
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {props.panel === "adjustments" ? <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <h3 className="text-[13px] font-semibold">Quick Adjustments</h3>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          {actions.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => props.onOpenAdjustment(key)}
              className="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-slate-200 px-2 text-[13px] font-medium text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
            >
              <Plus size={12} /> {label}
            </button>
          ))}
        </div>
      </section> : null}
      {props.panel === "biometric" && !props.hasBiometricOvertime ? <p className="p-4 text-[13px] text-slate-500">No biometric overtime to review.</p> : null}

      {props.panel === "rates" && props.branchRates.length > 1 ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <h3 className="px-3.5 py-2.5 text-[13px] font-semibold">Branch Rate Breakdown</h3>
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {props.branchRates.slice((page - 1) * 5, page * 5).map((entry) => (
                <div
                  key={entry.site}
                  className="flex items-center justify-between gap-3 px-3.5 py-2 text-[13px]"
                >
                  <span className="text-slate-500">
                    {entry.site} · {formatPayrollNumber(entry.hours)} hrs
                  </span>
                  <span className="tabular-nums font-medium text-slate-900">
                    {formatPeso(entry.ratePerDay)}/day
                  </span>
                </div>
              ))}
            </div>
          <PayrollDetailPagination page={page} totalPages={totalPages} onChange={setPage} />
        </section>
      ) : null}
    </aside>
  );
}
