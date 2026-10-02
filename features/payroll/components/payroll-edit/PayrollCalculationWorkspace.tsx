"use client";

import { useDialogEscape } from "@/lib/useDialogEscape";
import { useState, type ReactNode } from "react";
import type { DailyLogRow } from "@/types";
import type {
  PayrollAllowanceEntry,
  PayrollCashAdvanceEntry,
  PayrollDeductionEntry,
  PayrollOvertimeEntry,
  PayrollPaidLeaveEntry,
} from "@/features/payroll/types";
import type { AdjustmentFormType } from "@/features/payroll/utils/payrollEditModalHelpers";
import { PayrollAdjustmentEntries } from "@/features/payroll/components/payroll-edit/PayrollAdjustmentEntries";
import { PayrollAttendanceLogsTable } from "@/features/payroll/components/payroll-edit/PayrollAttendanceLogsTable";
import {
  PayrollCalculationFooter,
  PayrollOvertimeConfirmation,
} from "@/features/payroll/components/payroll-edit/PayrollCalculationActions";
import { PayrollCalculationHeader } from "@/features/payroll/components/payroll-edit/PayrollCalculationHeader";
import { PayrollCalculationSidebar } from "@/features/payroll/components/payroll-edit/PayrollCalculationSidebar";
import { PayrollSummaryCards } from "@/features/payroll/components/payroll-edit/PayrollSummaryCards";
import { CutoffAttendanceTable } from "@/features/payroll/components/payroll-edit/CutoffAttendanceTable";
import type { CutoffAttendanceDay } from "@/features/payroll/utils/payrollAttendanceEngine";

interface BranchRateRow {
  site: string;
  hours: number;
  payableDays: number;
  ratePerDay: number;
}

export interface PayrollCalculationWorkspaceProps {
  employeeName: string;
  roleName: string;
  siteLabel: string;
  periodLabel: string | null;
  matchStatus?: "MATCHED" | "NEEDS_REVIEW" | "UNMATCHED";
  rawAliases?: string[];
  onResolveIdentity?: () => void;
  logs: DailyLogRow[];
  visibleLogs: DailyLogRow[];
  page: number;
  totalPages: number;
  showAllLogs: boolean;
  paidHolidayDates: Set<string>;
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
  confirmBiometricOvertimeStatus: "approved" | "rejected" | null;
  cashAdvanceEntries: PayrollCashAdvanceEntry[];
  overtimeEntries: PayrollOvertimeEntry[];
  paidLeaveEntries: PayrollPaidLeaveEntry[];
  allowanceEntries: PayrollAllowanceEntry[];
  deductionEntries: PayrollDeductionEntry[];
  branchRates: BranchRateRow[];
  showBranchRates: boolean;
  isPayrollManager: boolean;
  isSaving: boolean;
  adjustmentDialog: ReactNode;
  attendanceResolutionDialog?: ReactNode;
  cutoffAttendanceDays?: CutoffAttendanceDay[];
  onResolveAttendance?: (day: CutoffAttendanceDay) => void;
  getRegularHours: (log: DailyLogRow) => number;
  getOvertimeHours: (log: DailyLogRow) => number;
  onUpdateHour: (
    log: DailyLogRow,
    field: "regularHours" | "overtimeHours",
    value: string,
  ) => void;
  onPageChange: (page: number) => void;
  onToggleAllLogs: () => void;
  onToggleBranchRates: () => void;
  onOpenAdjustment: (form: Exclude<AdjustmentFormType, null>) => void;
  onRemoveCashAdvance: (id: string) => void;
  onRemoveOvertime: (id: string) => void;
  onRemovePaidLeave: (id: string) => void;
  onRemoveAllowance: (id: string) => void;
  onBiometricDecision: (status: "approved" | "rejected") => void;
  onCancelBiometricDecision: () => void;
  onConfirmBiometricDecision: () => void;
  onClose: () => void;
  onSave: () => void;
}

export function PayrollCalculationWorkspace(
  props: PayrollCalculationWorkspaceProps,
) {
  useDialogEscape(() => { if (!props.isSaving) props.onClose(); }, 50);
  const [activeTab, setActiveTab] = useState("attendance");
  const tabs = [["attendance", "Cutoff Attendance"], ["logs", "Biometric Logs"], ["biometric", "Biometric OT Decision"], ["adjustments", "Adjustment Breakdown"], ["summary", "Calculation Summary"], ...(props.branchRates.length > 1 ? [["rates", "Branch Rates"]] : [])];
  const summaryProps = {
    attendanceDays: props.attendanceDays,
    daysWorked: props.daysWorked,
    actualWorkedHours: props.actualWorkedHours,
    regularWorkedHours: props.regularWorkedHours,
    overtimeHours: props.overtimeHours,
    adjustedTotalPay: props.adjustedTotalPay,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-3 sm:p-6">
      <div className="flex h-[min(860px,92dvh)] w-full max-w-[1280px] flex-col overflow-hidden border border-slate-200 bg-[#f8faf9] rounded-2xl shadow-2xl">
        <PayrollCalculationHeader
          employeeName={props.employeeName}
          roleName={props.roleName}
          siteLabel={props.siteLabel}
          periodLabel={props.periodLabel}
          matchStatus={props.matchStatus}
          rawAliases={props.rawAliases}
          onResolveIdentity={props.onResolveIdentity}
          onClose={props.onClose}
        />
        <PayrollSummaryCards {...summaryProps} />

        <div role="tablist" aria-label="Employee payroll details" className="flex shrink-0 flex-wrap gap-1 border-b border-slate-200 bg-white px-3 py-2">
          {tabs.map(([id, label]) => <button key={id} id={`payroll-tab-${id}`} type="button" role="tab" aria-selected={activeTab === id} tabIndex={activeTab === id ? 0 : -1} aria-controls="payroll-detail-panel" onKeyDown={(event) => {
            const index = tabs.findIndex(([key]) => key === id);
            const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
            if (next === null) return;
            event.preventDefault();
            setActiveTab(tabs[next][0]);
            document.getElementById(`payroll-tab-${tabs[next][0]}`)?.focus();
          }} onClick={() => setActiveTab(id)} className={`rounded-lg px-3 py-2 text-[13px] font-medium ${activeTab === id ? "bg-teal-50 text-teal-800" : "text-slate-500 hover:bg-slate-50"}`}>{label}</button>)}
        </div>
        <main id="payroll-detail-panel" role="tabpanel" aria-labelledby={`payroll-tab-${activeTab}`} className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
          <div className="space-y-3">
            <div>
              {activeTab === "attendance" && !props.cutoffAttendanceDays?.length ? <p className="p-4 text-[13px] text-slate-500">No cutoff attendance available. Open Biometric Logs to review attendance records.</p> : null}
              {activeTab === "attendance" && props.cutoffAttendanceDays?.length && props.onResolveAttendance ? (
                <CutoffAttendanceTable
                  days={props.cutoffAttendanceDays}
                  onResolve={props.onResolveAttendance}
                />
              ) : null}
              {activeTab === "logs" ? (
                <PayrollAttendanceLogsTable
                logs={props.logs}
                visibleLogs={props.visibleLogs}
                page={props.page}
                totalPages={props.totalPages}
                showAllLogs={props.showAllLogs}
                paidHolidayDates={props.paidHolidayDates}
                getRegularHours={props.getRegularHours}
                getOvertimeHours={props.getOvertimeHours}
                onUpdateHour={props.onUpdateHour}
                onPageChange={props.onPageChange}
                onToggleAllLogs={props.onToggleAllLogs}
                />
              ) : null}
              {activeTab === "adjustments" ? <PayrollAdjustmentEntries
                cashAdvanceEntries={props.cashAdvanceEntries}
                overtimeEntries={props.overtimeEntries}
                paidLeaveEntries={props.paidLeaveEntries}
                allowanceEntries={props.allowanceEntries}
                deductionEntries={props.deductionEntries}
                onRemoveCashAdvance={props.onRemoveCashAdvance}
                onRemoveOvertime={props.onRemoveOvertime}
                onRemovePaidLeave={props.onRemovePaidLeave}
                onRemoveAllowance={props.onRemoveAllowance}
              /> : null}
            </div>

            <PayrollCalculationSidebar
              panel={activeTab}
              {...summaryProps}
              baseWorkedPay={props.baseWorkedPay}
              overtimePay={props.overtimePay}
              grossPay={props.grossPay}
              adjustmentTotal={props.adjustmentTotal}
              hasBiometricOvertime={props.hasBiometricOvertime}
              biometricOvertimeHours={props.biometricOvertimeHours}
              biometricOvertimeStatus={props.biometricOvertimeStatus}
              branchRates={props.branchRates}
              showBranchRates={props.showBranchRates}
              isPayrollManager={props.isPayrollManager}
              onToggleBranchRates={props.onToggleBranchRates}
              onOpenAdjustment={props.onOpenAdjustment}
              onBiometricDecision={props.onBiometricDecision}
            />
          </div>
        </main>

        <PayrollCalculationFooter
          isSaving={props.isSaving}
          saveDisabled={props.isSaving}
          onClose={props.onClose}
          onSave={props.onSave}
        />
      </div>

      {props.adjustmentDialog}
      {props.attendanceResolutionDialog}
      <PayrollOvertimeConfirmation
        isOpen={props.confirmBiometricOvertimeStatus !== null}
        onCancel={props.onCancelBiometricDecision}
        onConfirm={props.onConfirmBiometricDecision}
      />
    </div>
  );
}
