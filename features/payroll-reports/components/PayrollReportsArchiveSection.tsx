"use client";

import { LoaderCircle } from "lucide-react";
import { createPortal } from "react-dom";
import WorkspaceListPagination from "@/components/workspace/WorkspaceListPagination";
import PayrollReportFilters from "./PayrollReportFilters";
import PayrollReportsTable from "./PayrollReportsTable";
import { usePayrollReportFilters } from "../hooks/usePayrollReportFilters";
import styles from "@/components/workspace/workspace.module.css";
import {
  formatPayrollReportPeriodLabel,
} from "@/features/payroll-reports/utils/payrollReportHelpers";
import type {
  PayrollRunRow,
  ReportActionsMenuState,
} from "@/features/payroll-reports/types";

export default function PayrollReportsArchiveSection({
  reports,
  refreshing,
  deletingRunId,
  pendingDecisionRunId,
  pendingDecisionAction,
  openMenu,
  openMenuReport,
  deleteConfirmReport,
  rejectConfirmReport,
  rejectionReason,
  onToggleMenu,
  onViewReport,
  onApproveReport,
  onRejectReport,
  onAskDelete,
  onCloseRejectConfirm,
  onRejectionReasonChange,
  onConfirmReject,
  onCloseDeleteConfirm,
  onDeleteReport,
}: {
  reports: PayrollRunRow[];
  refreshing: boolean;
  deletingRunId: string | null;
  pendingDecisionRunId: string | null;
  pendingDecisionAction: "approve" | "reject" | null;
  openMenu: ReportActionsMenuState | null;
  openMenuReport: PayrollRunRow | null;
  deleteConfirmReport: PayrollRunRow | null;
  rejectConfirmReport: PayrollRunRow | null;
  rejectionReason: string;
  onToggleMenu: (report: PayrollRunRow, rect: DOMRect) => void;
  onViewReport: (report: PayrollRunRow) => void;
  onApproveReport: (report: PayrollRunRow) => void;
  onRejectReport: (report: PayrollRunRow) => void;
  onAskDelete: (report: PayrollRunRow) => void;
  onCloseRejectConfirm: () => void;
  onRejectionReasonChange: (value: string) => void;
  onConfirmReject: () => void;
  onCloseDeleteConfirm: () => void;
  onDeleteReport: (report: PayrollRunRow) => void;
}) {
  const filters = usePayrollReportFilters(reports);

  return (
    <>
      <section aria-label="Payroll records" className={styles.panel}>
        <PayrollReportFilters state={filters} />
        {refreshing && <span className="sr-only" role="status">Refreshing payroll reports</span>}
        <PayrollReportsTable reports={filters.pagination.pageRows} deletingRunId={deletingRunId}
          pendingDecisionRunId={pendingDecisionRunId} onToggleMenu={onToggleMenu} />
        <WorkspaceListPagination {...filters.pagination} total={filters.visibleReports.length} noun="payroll runs" label="Payroll records" />
      </section>

      {openMenu && openMenuReport
        ? createPortal(
            <div
              data-report-actions-root
              className="fixed z-[140] min-w-[170px] -translate-x-full overflow-hidden rounded-lg border border-transparent bg-white text-left shadow-workspace"
              style={{ top: openMenu.top, left: openMenu.left }}
            >
              <button
                type="button"
                onClick={() => onViewReport(openMenuReport)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-apple-charcoal transition hover:bg-teal-50 hover:text-teal-800"
              >
                View Reports
              </button>
              {openMenuReport.status === "submitted" ? (
                <>
                  <button
                    type="button"
                    onClick={() => onApproveReport(openMenuReport)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={pendingDecisionRunId === openMenuReport.id}
                  >
                    {pendingDecisionRunId === openMenuReport.id &&
                    pendingDecisionAction === "approve"
                      ? "Updating..."
                      : "Approve Payroll"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRejectReport(openMenuReport)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={pendingDecisionRunId === openMenuReport.id}
                  >
                    {pendingDecisionRunId === openMenuReport.id &&
                    pendingDecisionAction === "reject"
                      ? "Updating..."
                      : "Return Payroll"}
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => onAskDelete(openMenuReport)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  deletingRunId === openMenuReport.id ||
                  pendingDecisionRunId === openMenuReport.id
                }
              >
                {deletingRunId === openMenuReport.id
                  ? "Deleting..."
                  : "Delete Payroll"}
              </button>
            </div>,
            document.body,
          )
        : null}

      {deleteConfirmReport
        ? createPortal(
            <div
              className="fixed inset-0 z-[150] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (
                  event.target === event.currentTarget &&
                  deletingRunId !== deleteConfirmReport.id
                ) {
                  onCloseDeleteConfirm();
                }
              }}
            >
              <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-workspace">
                <div className="border-b border-apple-mist bg-[linear-gradient(135deg,#063b38,#075f5b,#087a75)] px-5 py-4 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                    Confirm Delete
                  </p>
                  <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em]">
                    Delete Payroll Report?
                  </h3>
                </div>
                <div className="space-y-4 px-5 py-4">
                  <p className="text-sm text-apple-charcoal">
                    Delete payroll report for{" "}
                    <span className="font-semibold">
                      {formatPayrollReportPeriodLabel(deleteConfirmReport)}
                    </span>
                    ? This cannot be undone.
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={onCloseDeleteConfirm}
                      disabled={deletingRunId === deleteConfirmReport.id}
                      className="inline-flex h-9 items-center rounded-lg border border-apple-mist bg-white px-3 text-sm font-semibold text-apple-charcoal transition hover:border-apple-steel disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteReport(deleteConfirmReport)}
                      disabled={deletingRunId === deleteConfirmReport.id}
                      className="inline-flex h-9 items-center rounded-lg bg-rose-600 px-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingRunId === deleteConfirmReport.id ? (
                        <>
                          <LoaderCircle
                            size={15}
                            className="mr-2 animate-spin"
                          />
                          Deleting...
                        </>
                      ) : (
                        "Delete Payroll"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {rejectConfirmReport
        ? createPortal(
            <div
              className="fixed inset-0 z-[150] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (
                  event.target === event.currentTarget &&
                  pendingDecisionRunId !== rejectConfirmReport.id
                ) {
                  onCloseRejectConfirm();
                }
              }}
            >
              <div className="w-full max-w-lg overflow-hidden rounded-[24px] bg-white shadow-workspace">
                <div className="border-b border-apple-mist bg-[linear-gradient(135deg,#063b38,#075f5b,#087a75)] px-5 py-4 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
                    Return Payroll
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">
                    Send this payroll report back to HR
                  </h2>
                </div>

                <div className="space-y-4 px-5 py-5">
                  <p className="text-sm text-apple-steel">
                    Add an optional return note for{" "}
                    <span className="font-semibold text-apple-charcoal">
                      {formatPayrollReportPeriodLabel(rejectConfirmReport)}
                    </span>
                    .
                  </p>
                  <textarea
                    value={rejectionReason}
                    onChange={(event) =>
                      onRejectionReasonChange(event.target.value)
                    }
                    rows={5}
                    placeholder="Add an optional return note for HR."
                    className="w-full rounded-2xl border border-apple-mist px-3 py-3 text-sm text-apple-charcoal outline-none transition focus:border-[#076d69]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={onCloseRejectConfirm}
                      disabled={pendingDecisionRunId === rejectConfirmReport.id}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-apple-mist px-4 text-sm font-semibold text-apple-charcoal transition hover:border-teal-200 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={onConfirmReject}
                      disabled={pendingDecisionRunId === rejectConfirmReport.id}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-[#527d79] px-4 text-sm font-semibold text-white transition hover:bg-[#527d79] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pendingDecisionRunId === rejectConfirmReport.id &&
                      pendingDecisionAction === "reject" ? (
                        <>
                          <LoaderCircle
                            size={15}
                            className="mr-2 animate-spin"
                          />
                          Returning...
                        </>
                      ) : (
                        "Confirm Return"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
