"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  approvePayrollReportAction,
  deletePayrollReportAction,
  rejectPayrollReportAction,
} from "@/actions/payroll";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  splitPayrollReportSiteNames,
} from "@/features/payroll-reports/utils/payrollReportHelpers";
import type {
  AttendanceLogRow,
  PayrollRunDailyTotalRow,
  PayrollRunItemRow,
  PayrollRunRow,
  ReportActionsMenuState,
  ReportDetailsState,
} from "@/features/payroll-reports/types";

export function usePayrollReportsPage() {
  const [reports, setReports] = useState<PayrollRunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const [pendingDecisionRunId, setPendingDecisionRunId] = useState<string | null>(null);
  const [pendingDecisionAction, setPendingDecisionAction] =
    useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailsByRunId, setDetailsByRunId] = useState<Record<string, ReportDetailsState>>({});
  const [openMenu, setOpenMenu] = useState<ReportActionsMenuState | null>(null);
  const [deleteConfirmReport, setDeleteConfirmReport] = useState<PayrollRunRow | null>(null);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error: loadError } = await supabase
      .from("payroll_runs")
      .select(
        "id, attendance_import_id, site_name, period_label, period_start, period_end, status, net_total, created_at, submitted_at",
      )
      .neq("status", "rejected")
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (loadError) {
      setReports([]);
      setError(loadError.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setReports((data ?? []) as PayrollRunRow[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (!openMenu) return;
    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-report-actions-root]")) return;
      setOpenMenu(null);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    const closeMenu = () => setOpenMenu(null);
    document.addEventListener("mousedown", handleDocumentMouseDown);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);
    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [openMenu]);

  useEffect(() => {
    if (!deleteConfirmReport) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && deletingRunId !== deleteConfirmReport.id) {
        setDeleteConfirmReport(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [deleteConfirmReport, deletingRunId]);

  const sortedReports = useMemo(
    () =>
      [...reports].sort(
        (a, b) =>
          new Date(b.submitted_at ?? b.created_at).getTime() -
          new Date(a.submitted_at ?? a.created_at).getTime(),
      ),
    [reports],
  );

  useEffect(() => {
    if (!activeReportId) return;
    const report = sortedReports.find((row) => row.id === activeReportId);
    if (!report || detailsByRunId[report.id]) return;
    void loadReportDetails(report);
  }, [activeReportId, detailsByRunId, sortedReports]);

  async function loadReportDetails(report: PayrollRunRow) {
    setDetailsByRunId((prev) => ({
      ...prev,
      [report.id]: {
        loading: true,
        error: null,
        payrollItems: prev[report.id]?.payrollItems ?? [],
        attendanceLogs: prev[report.id]?.attendanceLogs ?? [],
        dailyTotals: prev[report.id]?.dailyTotals ?? [],
      },
    }));

    const supabase = createSupabaseBrowserClient();
    const [itemsResult, initialLogsResult, totalsResult] = await Promise.all([
      supabase
        .from("payroll_run_items")
        .select(
          "id, employee_name, role_code, site_name, days_worked, hours_worked, overtime_hours, rate_per_day, regular_pay, overtime_pay, holiday_pay, deductions_total, total_pay",
        )
        .eq("payroll_run_id", report.id)
        .order("employee_name", { ascending: true }),
      report.attendance_import_id
        ? supabase
            .from("attendance_records")
            .select(
              "id, employee_name, log_date, log_time, log_type, log_source, site_name",
            )
            .eq("import_id", report.attendance_import_id)
            .order("log_date", { ascending: true })
            .order("log_time", { ascending: true })
        : Promise.resolve({ data: [] as AttendanceLogRow[], error: null }),
      supabase
        .from("payroll_run_daily_totals")
        .select(
          "id, payroll_run_item_id, employee_name, role_code, site_name, payout_date, hours_worked, total_pay",
        )
        .eq("payroll_run_id", report.id)
        .order("payout_date", { ascending: true }),
    ]);

    let attendanceLogsData = (initialLogsResult.data ?? []) as AttendanceLogRow[];
    let attendanceLogsError = initialLogsResult.error;

    if (
      !attendanceLogsError &&
      attendanceLogsData.length === 0 &&
      report.period_start &&
      report.period_end
    ) {
      const fallbackSites = splitPayrollReportSiteNames(report.site_name).filter(
        (site) => site.length > 0,
      );
      let fallbackQuery = supabase
        .from("attendance_records")
        .select(
          "id, employee_name, log_date, log_time, log_type, log_source, site_name",
        )
        .gte("log_date", report.period_start)
        .lte("log_date", report.period_end)
        .order("log_date", { ascending: true })
        .order("log_time", { ascending: true });

      if (fallbackSites.length === 1) {
        fallbackQuery = fallbackQuery.eq("site_name", fallbackSites[0]);
      } else if (fallbackSites.length > 1) {
        fallbackQuery = fallbackQuery.in("site_name", fallbackSites);
      }

      const fallbackLogsResult = await fallbackQuery;
      if (fallbackLogsResult.error) {
        attendanceLogsError = fallbackLogsResult.error;
      } else {
        attendanceLogsData = (fallbackLogsResult.data ?? []) as AttendanceLogRow[];
      }
    }

    if (itemsResult.error || attendanceLogsError || totalsResult.error) {
      setDetailsByRunId((prev) => ({
        ...prev,
        [report.id]: {
          loading: false,
          error:
            itemsResult.error?.message ||
            attendanceLogsError?.message ||
            totalsResult.error?.message ||
            "Unable to load report logs.",
          payrollItems: [],
          attendanceLogs: [],
          dailyTotals: [],
        },
      }));
      return;
    }

    setDetailsByRunId((prev) => ({
      ...prev,
      [report.id]: {
        loading: false,
        error: null,
        payrollItems: (itemsResult.data ?? []) as PayrollRunItemRow[],
        attendanceLogs: attendanceLogsData,
        dailyTotals: (totalsResult.data ?? []) as PayrollRunDailyTotalRow[],
      },
    }));
  }

  async function handleDeleteReport(report: PayrollRunRow) {
    setDeletingRunId(report.id);
    setError(null);
    try {
      await deletePayrollReportAction(report.id);
      setReports((prev) => prev.filter((row) => row.id !== report.id));
      setDetailsByRunId((prev) => {
        const { [report.id]: _removed, ...rest } = prev;
        return rest;
      });
      setActiveReportId((prev) => (prev === report.id ? null : prev));
      setDeleteConfirmReport(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete payroll report.",
      );
    } finally {
      setDeletingRunId(null);
      setOpenMenu(null);
    }
  }

  async function handleApproveReport(report: PayrollRunRow) {
    setPendingDecisionRunId(report.id);
    setPendingDecisionAction("approve");
    setError(null);
    try {
      const result = await approvePayrollReportAction(report.id);
      setReports((prev) =>
        prev.map((row) =>
          row.id === report.id
            ? { ...row, status: "approved", submitted_at: row.submitted_at ?? result.approvedAt }
            : row,
        ),
      );
    } catch (approveError) {
      setError(
        approveError instanceof Error
          ? approveError.message
          : "Failed to approve payroll report.",
      );
    } finally {
      setPendingDecisionRunId(null);
      setPendingDecisionAction(null);
      setOpenMenu(null);
    }
  }

  async function handleRejectReport(report: PayrollRunRow) {
    setPendingDecisionRunId(report.id);
    setPendingDecisionAction("reject");
    setError(null);
    try {
      await rejectPayrollReportAction(report.id);
      setReports((prev) => prev.filter((row) => row.id !== report.id));
      setDetailsByRunId((prev) => {
        const { [report.id]: _removed, ...rest } = prev;
        return rest;
      });
      setActiveReportId((prev) => (prev === report.id ? null : prev));
    } catch (rejectError) {
      setError(
        rejectError instanceof Error
          ? rejectError.message
          : "Failed to reject payroll report.",
      );
    } finally {
      setPendingDecisionRunId(null);
      setPendingDecisionAction(null);
      setOpenMenu(null);
    }
  }

  const openMenuReport = openMenu
    ? (sortedReports.find((row) => row.id === openMenu.runId) ?? null)
    : null;
  const activeReport = activeReportId
    ? (sortedReports.find((row) => row.id === activeReportId) ?? null)
    : null;
  const activeDetails = activeReport ? (detailsByRunId[activeReport.id] ?? null) : null;
  const pendingReportsCount = useMemo(
    () => reports.filter((report) => report.status === "submitted").length,
    [reports],
  );

  return {
    reports,
    sortedReports,
    loading,
    refreshing,
    setRefreshing,
    deletingRunId,
    pendingDecisionRunId,
    pendingDecisionAction,
    error,
    openMenu,
    setOpenMenu,
    openMenuReport,
    deleteConfirmReport,
    setDeleteConfirmReport,
    activeReport,
    activeDetails,
    setActiveReportId,
    pendingReportsCount,
    loadReports,
    loadReportDetails,
    handleDeleteReport,
    handleApproveReport,
    handleRejectReport,
  };
}
