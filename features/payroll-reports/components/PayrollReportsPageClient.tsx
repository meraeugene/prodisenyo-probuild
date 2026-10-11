"use client";

import PayrollReportModal from "@/features/payroll-reports/components/PayrollReportModal";
import PayrollReportsArchiveSection from "@/features/payroll-reports/components/PayrollReportsArchiveSection";
import { usePayrollReportsPage } from "@/features/payroll-reports/hooks/usePayrollReportsPage";
import type { PayrollRunRow } from "@/features/payroll-reports/types";
import PayrollApprovalsHero from "./PayrollApprovalsHero";
import PayrollApprovalSummary from "./PayrollApprovalSummary";
import { useState } from "react";
import WorkspaceTabSwitch from "@/components/workspace/WorkspaceTabSwitch";
import CeoPayrollAnalytics from "./CeoPayrollAnalytics";

export default function PayrollReportsPageClient({
  initialData,
  initialView = "records",
}: {
  initialData: { reports: PayrollRunRow[] };
  initialView?: "records" | "analytics";
}) {
  const state = usePayrollReportsPage({ initialReports: initialData.reports });
  const [view, setView] = useState(initialView);
  const [analyticsOpened, setAnalyticsOpened] = useState(initialView === "analytics");

  return (
    <div className="min-h-full bg-white p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1560px] space-y-4">
        <PayrollApprovalsHero pending={state.pendingReportsCount} />
        <WorkspaceTabSwitch label="Payroll views" value={view} onChange={(next) => {
          state.setOpenMenu(null);
          setView(next);
          if (next === "analytics") setAnalyticsOpened(true);
        }} items={[{ value: "records", label: "Payroll records" }, { value: "analytics", label: "Analytics" }]} />
        <PayrollApprovalSummary reports={state.sortedReports} />
        {analyticsOpened && <CeoPayrollAnalytics reports={state.sortedReports} active={view === "analytics"} />}

        <div hidden={view !== "records"}>
        <PayrollReportsArchiveSection
          reports={state.sortedReports}
          refreshing={state.refreshing}
          deletingRunId={state.deletingRunId}
          pendingDecisionRunId={state.pendingDecisionRunId}
          pendingDecisionAction={state.pendingDecisionAction}
          openMenu={state.openMenu}
          openMenuReport={state.openMenuReport}
          deleteConfirmReport={state.deleteConfirmReport}
          rejectConfirmReport={state.rejectConfirmReport}
          rejectionReason={state.rejectionReason}
          onToggleMenu={(report, rect) =>
            state.setOpenMenu((prev) =>
              prev?.runId === report.id
                ? null
                : { runId: report.id, top: rect.bottom + 6, left: rect.right },
            )
          }
          onViewReport={(report) => {
            state.setActiveReportId(report.id);
            state.setOpenMenu(null);
          }}
          onApproveReport={(report) => {
            void state.handleApproveReport(report);
          }}
          onRejectReport={(report) => {
            state.setRejectConfirmReport(report);
            state.setRejectionReason("");
            state.setOpenMenu(null);
          }}
          onAskDelete={(report) => {
            state.setDeleteConfirmReport(report);
            state.setOpenMenu(null);
          }}
          onCloseRejectConfirm={() => {
            state.setRejectConfirmReport(null);
            state.setRejectionReason("");
          }}
          onRejectionReasonChange={state.setRejectionReason}
          onConfirmReject={() => {
            void state.handleRejectReport();
          }}
          onCloseDeleteConfirm={() => state.setDeleteConfirmReport(null)}
          onDeleteReport={(report) => {
            void state.handleDeleteReport(report);
          }}
        />
        </div>

        {state.error ? (
          <section className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {state.error}
          </section>
        ) : null}
      </div>

      {state.activeReport ? (
        <PayrollReportModal
          report={state.activeReport}
          details={state.activeDetails}
          onClose={() => state.setActiveReportId(null)}
          onRefresh={() => {
            void state.loadReportDetails();
          }}
        />
      ) : null}
    </div>
  );
}
