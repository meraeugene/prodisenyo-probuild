"use client";

import PayrollReportModal from "@/features/payroll-reports/components/PayrollReportModal";
import PayrollReportsArchiveSection from "@/features/payroll-reports/components/PayrollReportsArchiveSection";
import { usePayrollReportsPage } from "@/features/payroll-reports/hooks/usePayrollReportsPage";

export default function PayrollReportsPageClient() {
  const state = usePayrollReportsPage();

  return (
    <div className="p-6">
      <PayrollReportsArchiveSection
        reports={state.sortedReports}
        loading={state.loading}
        refreshing={state.refreshing}
        pendingReportsCount={state.pendingReportsCount}
        deletingRunId={state.deletingRunId}
        pendingDecisionRunId={state.pendingDecisionRunId}
        pendingDecisionAction={state.pendingDecisionAction}
        openMenu={state.openMenu}
        openMenuReport={state.openMenuReport}
        deleteConfirmReport={state.deleteConfirmReport}
        onRefresh={() => {
          state.setRefreshing(true);
          void state.loadReports();
        }}
        onToggleMenu={(report, rect) =>
          state.setOpenMenu((prev) =>
            prev?.runId === report.id
              ? null
              : { runId: report.id, top: rect.bottom + 6, left: rect.right },
          )
        }
        onCloseMenu={() => state.setOpenMenu(null)}
        onViewReport={(report) => {
          state.setActiveReportId(report.id);
          void state.loadReportDetails(report);
          state.setOpenMenu(null);
        }}
        onApproveReport={(report) => {
          void state.handleApproveReport(report);
        }}
        onRejectReport={(report) => {
          void state.handleRejectReport(report);
        }}
        onAskDelete={(report) => {
          state.setDeleteConfirmReport(report);
          state.setOpenMenu(null);
        }}
        onCloseDeleteConfirm={() => state.setDeleteConfirmReport(null)}
        onDeleteReport={(report) => {
          void state.handleDeleteReport(report);
        }}
      />

      {state.error ? (
        <section className="rounded-[14px] border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {state.error}
        </section>
      ) : null}

      {state.activeReport ? (
        <PayrollReportModal
          report={state.activeReport}
          details={state.activeDetails}
          onClose={() => state.setActiveReportId(null)}
          onRefresh={() => {
            void state.loadReportDetails(state.activeReport!);
          }}
        />
      ) : null}
    </div>
  );
}
