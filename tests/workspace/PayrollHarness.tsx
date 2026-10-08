import { useState } from "react";
import PayrollSection from "@/features/payroll/components/PayrollSection";
import PayrollRateModal from "@/features/payroll/components/PayrollRateModal";
import PayrollSubmitConfirmation from "@/features/payroll/components/generate-payroll/PayrollSubmitConfirmation";
import { PayrollCalculationWorkspace } from "@/features/payroll/components/payroll-edit/PayrollCalculationWorkspace";
import { PayrollAdjustmentDialog, type PayrollAdjustmentFieldKey } from "@/features/payroll/components/payroll-edit/PayrollAdjustmentDialog";
import type { AdjustmentFormType } from "@/features/payroll/utils/payrollEditModalHelpers";
import type { UsePayrollStateResult } from "@/features/payroll/hooks/usePayrollState";
import type { PayrollRow } from "@/lib/payrollEngine";
import { buildCutoffAttendance } from "@/features/payroll/utils/payrollAttendanceEngine";

const rows: PayrollRow[] = Array.from({ length: 12 }, (_, index) => ({ id: String(index), worker: `Employee ${String(index + 1).padStart(2, "0")}`,
  employeeId: String(index), role: "WORKER", site: "Manila", date: "2026-10-01", matchStatus: "MATCHED", hoursWorked: 8, overtimeHours: 0,
  defaultRate: 62.5, customRate: null, rate: 62.5, regularPay: 500, overtimePay: 0, totalPay: 500,
}));
const cutoffAttendanceDays = buildCutoffAttendance({
  periodStart: "2026-10-01", periodEnd: "2026-10-15",
  biometricDays: Array.from({ length: 15 }, (_, index) => ({
    date: `2026-10-${String(index + 1).padStart(2, "0")}`, timeIn: "08:00", timeOut: "17:00",
    time1InSite: "Manila Warehouse Renovation", time1OutSite: "Manila Warehouse Renovation",
    rawWorkedSeconds: 32400, breakSeconds: 3600, calculatedRegularSeconds: 28800, detectedOvertimeSeconds: 0,
  })),
});

export default function PayrollHarness() {
  const [mode, setMode] = useState("");
  const [employee, setEmployee] = useState("Employee 01");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [site, setSite] = useState("ALL");
  const [sort, setSort] = useState("name-asc");
  const [rateDraft, setRateDraft] = useState({});
  const [adjustment, setAdjustment] = useState<AdjustmentFormType>(null);
  const [values, setValues] = useState({} as Record<PayrollAdjustmentFieldKey, string>);
  const payroll = {
    payrollGenerated: true, payrollRows: rows, payrollBaseComputedRows: rows, payrollSort: sort, payrollNameFilter: query, payrollSiteFilter: site,
    payrollDateFilter: "", payrollPage: page, payrollTotalPages: 1, payrollPreviewLogs: [], payrollActiveRowsCount: 0, payrollPreviewStart: 0, payrollPreviewEnd: 0,
    payrollDateRange: { start: "2026-10-01", end: "2026-10-15" }, payrollOverrides: {}, employeeBranchRates: {}, dailyRows: [], paidHolidays: [], payableHolidayDays: 0,
    showPayrollRateModal: mode === "rates", payrollRateDraft: rateDraft, setPayrollRateDraft: setRateDraft, closePayrollRateModal: () => setMode(""),
    openPayrollRateModal: () => setMode("rates"), openPayrollEditModal: (row: PayrollRow) => { setEmployee(row.worker); setMode("calculation"); },
    setPayrollPage: setPage, setPayrollNameFilter: setQuery, setPayrollSiteFilter: setSite, setPayrollSort: setSort, setPayrollTab: () => {},
    clearPayrollFilters: () => { setQuery(""); setSite("ALL"); setPage(1); }, addManualPaidHoliday: () => {}, removePaidHoliday: () => {},
    loadPhilippinePaidHolidays: async () => {}, clearPaidHolidays: () => {},
  } as unknown as UsePayrollStateResult;
  return <>
    <PayrollSection dailyRowsCount={12} availableSites={["Manila"]} payroll={payroll} onGeneratePreview={() => {}} onSaveDraft={() => {}}
      onSubmitPayroll={() => setMode("submit")} currentPayrollRunId="draft" currentPayrollRunStatus="draft" currentUserRole="payroll_manager" savePending={false} />
    <PayrollRateModal payroll={payroll} />
    {mode === "submit" && <PayrollSubmitConfirmation site="Manila" attendancePeriod="October 1–15" isPending={false} onClose={() => setMode("")} onConfirm={() => setMode("")} />}
    {mode === "calculation" && <PayrollCalculationWorkspace employeeName={employee} roleName="Worker" siteLabel="Manila" periodLabel="October 1–15"
      cutoffAttendanceDays={cutoffAttendanceDays} onResolveAttendance={() => {}}
      logs={[]} visibleLogs={[]} page={1} totalPages={1} showAllLogs={false} paidHolidayDates={new Set()} attendanceDays={1} daysWorked={1} actualWorkedHours={8}
      regularWorkedHours={8} overtimeHours={0} baseWorkedPay={500} overtimePay={0} grossPay={500} adjustedTotalPay={500} adjustmentTotal={0}
      hasBiometricOvertime={false} biometricOvertimeHours={0} biometricOvertimeStatus={null} confirmBiometricOvertimeStatus={null}
      cashAdvanceEntries={[]} overtimeEntries={[]} paidLeaveEntries={[]} allowanceEntries={[]} deductionEntries={[]} branchRates={[]} showBranchRates={false}
      isPayrollManager isSaving={false} getRegularHours={() => 8} getOvertimeHours={() => 0} onUpdateHour={() => {}} onPageChange={() => {}}
      onToggleAllLogs={() => {}} onToggleBranchRates={() => {}} onOpenAdjustment={setAdjustment} onRemoveCashAdvance={() => {}} onRemoveOvertime={() => {}}
      onRemovePaidLeave={() => {}} onRemoveAllowance={() => {}} onBiometricDecision={() => {}} onCancelBiometricDecision={() => {}} onConfirmBiometricDecision={() => {}}
      onClose={() => setMode("")} onSave={() => setMode("")} adjustmentDialog={adjustment && <PayrollAdjustmentDialog activeForm={adjustment} values={values}
        overtimeValidationMessage={null} onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))} onClose={() => setAdjustment(null)}
        onSubmit={() => setAdjustment(null)} onClearReductions={() => {}} />} />}
  </>;
}
