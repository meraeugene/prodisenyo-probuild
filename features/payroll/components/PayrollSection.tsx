"use client";

import { Banknote, CheckCircle2, Clock3, FileCheck2, TriangleAlert, UsersRound } from "lucide-react";
import { exportAllPayslipsToPdf } from "@/lib/payslipExport";
import type { UsePayrollStateResult } from "@/features/payroll/hooks/usePayrollState";
import type { AppRole } from "@/types/database";
import PaidHolidayModal from "@/features/payroll/components/PaidHolidayModal";
import { usePayrollWorkspace } from "@/features/payroll/hooks/usePayrollWorkspace";
import { formatPeso } from "@/features/payroll/utils/payrollWorkspace";
import PayrollWorkspaceHeader from "./generate-payroll/PayrollWorkspaceHeader";
import PayrollSummaryCards from "./generate-payroll/PayrollSummaryCards";
import PayrollWorkspaceControls from "./generate-payroll/PayrollWorkspaceControls";
import PayrollEmployeesTable from "./generate-payroll/PayrollEmployeesTable";
import PayrollLogsTable from "./generate-payroll/PayrollLogsTable";
import PayrollPagination from "./generate-payroll/PayrollPagination";
import { useState } from "react";

interface PayrollSectionProps {
  dailyRowsCount: number;
  availableSites: string[];
  payroll: UsePayrollStateResult;
  onGeneratePreview: () => void;
  onSavePayroll: () => void;
  currentPayrollRunId: string | null;
  currentPayrollRunStatus: "draft" | "submitted" | "approved" | "rejected" | null;
  currentUserRole: AppRole | null;
  savePending: boolean;
}

export default function PayrollSection({
  dailyRowsCount,
  availableSites,
  payroll,
  onGeneratePreview,
  onSavePayroll,
  currentPayrollRunStatus,
  currentUserRole,
  savePending,
}: PayrollSectionProps) {
  const [showPaidHolidayModal, setShowPaidHolidayModal] = useState(false);
  const workspace = usePayrollWorkspace(payroll);
  const canSubmit =
    (currentUserRole === "payroll_manager" || currentUserRole === "ceo") &&
    payroll.payrollGenerated &&
    payroll.payrollRows.length > 0;

  const logTotalPages = payroll.payrollTotalPages;
  const logPage = Math.min(payroll.payrollPage, logTotalPages);
  const isLogs = workspace.activeView === "logs";

  return (
    <section className="min-h-screen bg-[#fbfcfc] px-4 pb-0 pt-5 sm:px-6 sm:pt-6 xl:px-7">
      <PayrollWorkspaceHeader
        generated={payroll.payrollGenerated}
        canSubmit={canSubmit}
        savePending={savePending}
        periodStart={payroll.payrollDateRange?.start}
        periodEnd={payroll.payrollDateRange?.end}
        onGenerate={onGeneratePreview}
        onSubmit={onSavePayroll}
      />

      {currentPayrollRunStatus ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#cfe5e3] bg-[#eff9f7] px-3 py-1.5 text-[11px] font-semibold text-[#08766f]">
          <FileCheck2 size={13} />
          Report status: {currentPayrollRunStatus === "submitted" ? "Pending CEO review" : currentPayrollRunStatus}
        </div>
      ) : null}

      {payroll.payrollGenerated ? (
        <div className="mt-5 space-y-4">
          <PayrollSummaryCards
            totalEmployees={workspace.allEmployees.length}
            needsReview={workspace.needsReview}
            ready={workspace.ready}
            totalPayroll={workspace.totalPayroll}
          />

          <div className="rounded-[11px] bg-white">
            <PayrollWorkspaceControls
              activeView={workspace.activeView}
              allCount={workspace.allEmployees.length}
              reviewCount={workspace.needsReview}
              readyCount={workspace.ready}
              search={payroll.payrollNameFilter}
              site={payroll.payrollSiteFilter}
              sort={payroll.payrollSort}
              sites={availableSites}
              exportDisabled={workspace.payslipRecords.length === 0}
              onViewChange={workspace.changeView}
              onSearchChange={(value) => {
                payroll.setPayrollNameFilter(value);
                payroll.setPayrollPage(1);
              }}
              onSiteChange={(value) => {
                payroll.setPayrollSiteFilter(value);
                payroll.setPayrollPage(1);
              }}
              onSortChange={payroll.setPayrollSort}
              onClear={() => {
                payroll.clearPayrollFilters();
                workspace.changeView("all");
              }}
              onRates={payroll.openPayrollRateModal}
              onHolidays={() => setShowPaidHolidayModal(true)}
              onExport={() => void exportAllPayslipsToPdf(workspace.payslipRecords)}
            />

            {isLogs ? (
              <PayrollLogsTable logs={payroll.payrollPreviewLogs} />
            ) : (
              <PayrollEmployeesTable
                employees={workspace.visibleEmployees}
                payroll={payroll}
                periodLabel={workspace.periodLabel ?? ""}
                search={payroll.payrollNameFilter}
                workdayTarget={workspace.workdayTarget}
              />
            )}

            <PayrollPagination
              page={isLogs ? logPage : workspace.page}
              totalPages={isLogs ? logTotalPages : workspace.totalPages}
              totalRows={isLogs ? payroll.payrollActiveRowsCount : workspace.employeeCount}
              start={isLogs ? payroll.payrollPreviewStart : workspace.start}
              end={isLogs ? payroll.payrollPreviewEnd : workspace.end}
              rowLabel={isLogs ? "attendance logs" : "employees"}
              onPageChange={payroll.setPayrollPage}
            />
          </div>

          <PayrollBottomSummary
            employees={workspace.allEmployees.length}
            ready={workspace.ready}
            needsReview={workspace.needsReview}
            hours={workspace.totalHours}
            payrollTotal={workspace.totalPayroll}
            onReview={() => workspace.changeView("review")}
          />
        </div>
      ) : (
        <div className="mt-6 grid min-h-[420px] place-items-center rounded-[12px] border border-dashed border-[#bfd5d5] bg-white px-5 text-center">
          <div className="max-w-md">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e7f7f3] text-[#0b8f85]"><Banknote size={28} /></span>
            <h2 className="mt-5 text-xl font-bold tracking-[-0.025em] text-[#102942]">Build this period’s payroll</h2>
            <p className="mt-2 text-sm leading-6 text-[#6b7f92]">
              {dailyRowsCount > 0
                ? "Your attendance rows are ready. Generate a preview to review employee hours, rates, exceptions, and pay."
                : "Upload and review attendance records before generating a payroll preview."}
            </p>
          </div>
        </div>
      )}

      <PaidHolidayModal
        show={showPaidHolidayModal}
        holidays={payroll.paidHolidays}
        periodStart={payroll.payrollDateRange?.start ?? null}
        periodEnd={payroll.payrollDateRange?.end ?? null}
        onClose={() => setShowPaidHolidayModal(false)}
        onAddManualHoliday={payroll.addManualPaidHoliday}
        onRemoveHoliday={payroll.removePaidHoliday}
        onLoadPhilippineHolidays={payroll.loadPhilippinePaidHolidays}
        onClearHolidays={payroll.clearPaidHolidays}
      />
    </section>
  );
}

function PayrollBottomSummary({ employees, ready, needsReview, hours, payrollTotal, onReview }: {
  employees: number; ready: number; needsReview: number; hours: number; payrollTotal: number; onReview: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-[#cae5e2] bg-white/95 px-4 py-3 shadow-[0_-10px_28px_rgba(18,58,66,0.06)] backdrop-blur sm:-mx-6 sm:px-6 xl:-mx-7 xl:px-7">
      <SummaryItem icon={UsersRound} value={String(employees)} label="Total Employees" />
      <SummaryItem icon={CheckCircle2} value={String(ready)} label="Ready" />
      <SummaryItem icon={TriangleAlert} value={String(needsReview)} label="Needs Review" warning />
      <SummaryItem icon={Clock3} value={hours.toLocaleString("en-PH", { maximumFractionDigits: 2 })} label="Total Hours" />
      <SummaryItem icon={Banknote} value={formatPeso(payrollTotal)} label="Total Payroll" />
      <button type="button" onClick={onReview} className="ml-auto h-10 rounded-[8px] border border-[#bfe4df] px-4 text-xs font-bold text-[#08766f] transition hover:bg-[#eff9f7]">View Exceptions →</button>
    </div>
  );
}

function SummaryItem({ icon: Icon, value, label, warning }: { icon: typeof UsersRound; value: string; label: string; warning?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={warning ? "flex h-9 w-9 items-center justify-center rounded-full bg-[#fff0dc] text-[#ef8b08]" : "flex h-9 w-9 items-center justify-center rounded-full bg-[#e4f7f0] text-[#079263]"}><Icon size={17} /></span>
      <div><p className={warning ? "text-sm font-bold text-[#d46409]" : "text-sm font-bold text-[#102942]"}>{value}</p><p className="text-[10px] text-[#718397]">{label}</p></div>
    </div>
  );
}
