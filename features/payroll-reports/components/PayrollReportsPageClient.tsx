"use client";

import { RefreshCw } from "lucide-react";
import DashboardPageHero from "@/components/DashboardPageHero";
import PayrollReportModal from "@/features/payroll-reports/components/PayrollReportModal";
import PayrollReportsArchiveSkeleton from "@/features/payroll-reports/components/PayrollReportsArchiveSkeleton";
import PayrollReportsArchiveSection from "@/features/payroll-reports/components/PayrollReportsArchiveSection";
import { usePayrollReportsPage } from "@/features/payroll-reports/hooks/usePayrollReportsPage";

export default function PayrollReportsPageClient() {
  const state = usePayrollReportsPage();

  return (
    <div className="p-6">
      <DashboardPageHero
        eyebrow="Payroll Reports"
        title="Payroll Report Review"
        description="Pending payroll reports stay here for CEO review. Only approved payroll reports flow into the CEO dashboard totals."
        actions={
          <button
            type="button"
            onClick={() => {
              state.setRefreshing(true);
              void state.loadReports();
            }}
            disabled={state.refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[rgb(var(--theme-chart-5))] px-4 text-sm font-semibold text-[rgb(var(--apple-black))] transition hover:bg-[rgb(var(--apple-silver))] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} className={state.refreshing ? "animate-spin" : ""} />
            Sync
          </button>
        }
      />

      {state.loading || state.refreshing ? (
        <PayrollReportsArchiveSkeleton />
      ) : (
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
          onToggleMenu={(report, rect) =>
            state.setOpenMenu((prev) =>
              prev?.runId === report.id
                ? null
                : { runId: report.id, top: rect.bottom + 6, left: rect.right },
            )
          }
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
      )}

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
