"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  X,
  XCircle,
} from "lucide-react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { buildDailyRows } from "@/features/attendance/utils/attendanceSelectors";
import {
  expandIsoRange,
  extractIsoPayrollRange,
} from "@/features/payroll/utils/payrollDateHelpers";
import {
  extractSiteName,
  formatLogTime as formatPayrollLogTime,
  toWeekLabel,
} from "@/features/payroll/utils/payrollFormatters";
import {
  approveOvertimeAdjustmentAction,
  rejectOvertimeAdjustmentAction,
} from "@/actions/payroll";
import type { AttendanceRecord, DailyLogRow } from "@/types";

interface PendingOvertimeRequest {
  id: string;
  status: "pending" | "approved" | "rejected";
  payroll_run_id: string | null;
  attendance_import_id: string | null;
  employee_name: string | null;
  role_code: string | null;
  site_name: string | null;
  period_label: string | null;
  quantity: number;
  amount: number;
  notes: string | null;
  created_at: string;
  effective_date: string | null;
  period_start: string | null;
  period_end: string | null;
  payroll_runs:
    | {
        site_name: string;
        period_label: string;
      }
    | {
        site_name: string;
        period_label: string;
      }[]
    | null;
  payroll_run_items:
    | {
        employee_name: string;
        site_name: string;
      }
    | {
        employee_name: string;
        site_name: string;
      }[]
    | null;
}

interface PayrollApprovalQueueProps {
  role: "ceo" | "payroll_manager" | null;
  roleLoading?: boolean;
  onRequestResolved?: (runId: string | null) => void;
  refreshToken?: number;
}

interface AttendanceLogRow {
  id: string;
  log_date: string;
  log_time: string;
  log_type: "IN" | "OUT";
  log_source: "Time1" | "Time2" | "OT";
  site_name: string;
}

interface EmployeeLogsModalState {
  requestId: string;
  employeeLabel: string;
  siteLabel: string;
  periodLabel: string;
  requestDailyLogs: DailyLogRow[];
  loading: boolean;
  error: string | null;
}

function formatMoney(value: number): string {
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getRelationValue<T extends object>(
  relation: T | T[] | null,
): T | null {
  if (!relation) return null;
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

function formatRequestedAt(value: string): string {
  return new Date(value).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function resolveRequestPeriod(request: PendingOvertimeRequest): {
  start: string | null;
  end: string | null;
} {
  const parsedPeriod = extractIsoPayrollRange(request.period_label ?? "");
  const start = request.period_start ?? parsedPeriod?.start ?? null;
  const end = request.period_end ?? parsedPeriod?.end ?? start;

  return { start, end };
}

function buildRequestDailyLogRows(
  request: PendingOvertimeRequest,
  logs: AttendanceLogRow[],
): DailyLogRow[] {
  const employeeName = request.employee_name?.trim() || "Unknown Employee";
  const attendanceRecords: AttendanceRecord[] = logs.map((log) => ({
    date: log.log_date,
    employee: employeeName,
    logTime: log.log_time,
    type: log.log_type,
    source: log.log_source,
    site: log.site_name,
  }));
  const groupedRows = buildDailyRows(attendanceRecords).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const { start, end } = resolveRequestPeriod(request);
  const periodDates = start && end ? expandIsoRange(start, end) : [];

  if (periodDates.length === 0) {
    return groupedRows;
  }

  const rowsByDate = new Map(groupedRows.map((row) => [row.date, row]));

  return periodDates.map(
    (date) =>
      rowsByDate.get(date) ?? {
        date,
        employee: employeeName,
        time1In: "",
        time1Out: "",
        time2In: "",
        time2Out: "",
        otIn: "",
        otOut: "",
        hours: 0,
        site: "",
      },
  );
}

function ApprovalQueueSkeleton() {
  return (
    <div
      className="mt-4 grid items-stretch gap-3 md:grid-cols-2 "
      aria-hidden="true"
    >
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={`approval-skeleton-${index}`}
          className="h-full rounded-2xl border border-apple-mist bg-[rgb(var(--apple-snow))] p-5 shadow-[0_8px_20px_rgba(24,83,43,0.04)]"
        >
          <div className="flex h-full flex-col animate-pulse">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-5 w-32 rounded-full bg-apple-mist" />
                <div className="h-6 w-28 rounded-full bg-apple-mist/80" />
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="h-4 w-28 rounded-full bg-apple-mist/80" />
                <div className="h-4 w-36 rounded-full bg-apple-mist/80" />
              </div>

              <div className="space-y-2">
                <div className="h-3 w-40 rounded-full bg-apple-mist/70" />
                <div className="h-10 w-full rounded-xl border border-apple-mist bg-white/80" />
              </div>

              <div className="space-y-2">
                <div className="h-8 w-36 rounded-lg border border-apple-mist bg-white/80" />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-apple-mist bg-white p-4 shadow-sm">
              <div className="space-y-2">
                <div className="h-3 w-20 rounded-full bg-apple-mist/70" />
                <div className="h-8 w-24 rounded-full bg-apple-mist" />
                <div className="h-3 w-16 rounded-full bg-apple-mist/80" />
              </div>
            </div>

            <div className="mt-auto flex items-end justify-between gap-4 pt-6">
              <div className="h-3 w-36 rounded-full bg-apple-mist/70" />
              <div className="flex gap-2">
                <div className="h-10 w-24 rounded-xl bg-apple-mist/80" />
                <div className="h-10 w-36 rounded-xl bg-apple-mist" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmployeeLogsModal({
  modalState,
  onClose,
}: {
  modalState: EmployeeLogsModalState;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-[min(1180px,96vw)] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.24)]">
        <div className="border-b border-emerald-950/10 bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] px-6 py-5 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                Employee Logs
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                {modalState.employeeLabel}
              </h2>
              <p className="mt-2 text-sm text-white/80">
                {modalState.siteLabel} | {modalState.periodLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close employee logs modal"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="min-h-0 overflow-auto px-6 py-6">
          {modalState.loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 rounded-2xl bg-[rgb(var(--apple-snow))]"
                  />
                ))}
              </div>
              <div className="overflow-hidden rounded-2xl border border-apple-mist bg-white">
                <div className="border-b border-apple-mist px-4 py-4">
                  <div className="h-4 w-40 rounded-full bg-apple-mist" />
                </div>
                <div className="space-y-2 px-4 py-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-10 rounded-xl bg-[rgb(var(--apple-snow))]"
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : modalState.error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-700">
                {modalState.error}
              </p>
            </div>
          ) : modalState.requestDailyLogs.length === 0 ? (
            <div className="rounded-2xl border border-apple-mist bg-[rgb(var(--apple-snow))] p-5 text-sm text-apple-steel">
              No attendance logs found for this employee in the linked import.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-apple-mist bg-white">
              <div className="border-b border-apple-mist bg-[rgb(var(--apple-snow))] px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-apple-steel">
                  All Report Logs
                </p>
              </div>

              <div className="max-h-[62vh] overflow-auto">
                <table className="min-w-[760px] w-full text-xs">
                  <thead>
                    <tr className="border-b border-apple-mist">
                      {[
                        "Date/Week",
                        "Site",
                        "Time1 In",
                        "Time1 Out",
                        "Time2 In",
                        "Time2 Out",
                        "OT In",
                        "OT Out",
                        "Hours",
                      ].map((header) => (
                        <th
                          key={header}
                          className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-apple-steel ${
                            header === "Hours" ? "text-right" : "text-left"
                          }`}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modalState.requestDailyLogs.map((log, index) => (
                      <tr
                        key={`${modalState.requestId}-${log.date}-${index}`}
                        className="border-b border-apple-mist/60 text-apple-charcoal last:border-0 odd:bg-apple-snow/30"
                      >
                        <td className="px-3 py-2.5 font-medium">
                          {toWeekLabel(log.date)}
                        </td>
                        <td className="px-3 py-2.5 text-apple-smoke">
                          {extractSiteName(log.site) || "-"}
                        </td>
                        <td className="px-3 py-2.5">
                          {log.time1In ? (
                            formatPayrollLogTime(log.time1In)
                          ) : (
                            <span className="text-red-500">Missed</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {log.time1Out ? (
                            formatPayrollLogTime(log.time1Out)
                          ) : (
                            <span className="text-red-500">Missed</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {log.time2In ? (
                            formatPayrollLogTime(log.time2In)
                          ) : (
                            <span className="text-red-500">Missed</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {log.time2Out ? (
                            formatPayrollLogTime(log.time2Out)
                          ) : (
                            <span className="text-red-500">Missed</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {log.otIn ? formatPayrollLogTime(log.otIn) : "-"}
                        </td>
                        <td className="px-3 py-2.5">
                          {log.otOut ? formatPayrollLogTime(log.otOut) : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold">
                          {log.hours.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function PayrollApprovalQueue({
  role,
  roleLoading = false,
  onRequestResolved,
  refreshToken = 0,
}: PayrollApprovalQueueProps) {
  const [pendingRequests, setPendingRequests] = useState<
    PendingOvertimeRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [pendingActionType, setPendingActionType] = useState<
    "approve" | "reject" | null
  >(null);
  const [employeeLogsByRequestId, setEmployeeLogsByRequestId] = useState<
    Record<string, AttendanceLogRow[]>
  >({});
  const [employeeLogsLoadingByRequestId, setEmployeeLogsLoadingByRequestId] =
    useState<Record<string, boolean>>({});
  const [employeeLogsErrorByRequestId, setEmployeeLogsErrorByRequestId] =
    useState<Record<string, string | null>>({});
  const [activeLogsRequestId, setActiveLogsRequestId] = useState<string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function loadPendingRequests() {
      if (roleLoading) {
        setLoading(true);
        return;
      }

      if (role !== "ceo") {
        setPendingRequests([]);
        setEmployeeLogsByRequestId({});
        setEmployeeLogsLoadingByRequestId({});
        setEmployeeLogsErrorByRequestId({});
        setActiveLogsRequestId(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("payroll_adjustments")
        .select(
          "id, status, payroll_run_id, attendance_import_id, employee_name, role_code, site_name, period_label, period_start, period_end, quantity, amount, notes, created_at, effective_date, payroll_runs(site_name, period_label), payroll_run_items(employee_name, site_name)",
        )
        .eq("adjustment_type", "overtime")
        .in("status", ["pending", "approved", "rejected"])
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        toast.error("Unable to load pending overtime approvals.");
        setPendingRequests([]);
        setLoading(false);
        return;
      }

      setPendingRequests((data ?? []) as PendingOvertimeRequest[]);
      setLoading(false);
    }

    void loadPendingRequests();

    return () => {
      cancelled = true;
    };
  }, [role, roleLoading, refreshToken]);

  const hasRequests = useMemo(
    () => pendingRequests.length > 0,
    [pendingRequests.length],
  );
  const pendingCount = useMemo(
    () => pendingRequests.filter((request) => request.status === "pending").length,
    [pendingRequests],
  );

  async function loadEmployeeLogsForRequest(
    request: PendingOvertimeRequest,
  ): Promise<void> {
    if (!request.id) return;

    if (!request.attendance_import_id || !request.employee_name) {
      setEmployeeLogsErrorByRequestId((prev) => ({
        ...prev,
        [request.id]:
          "No linked attendance import was found for this overtime request.",
      }));
      return;
    }

    setEmployeeLogsLoadingByRequestId((prev) => ({
      ...prev,
      [request.id]: true,
    }));
    setEmployeeLogsErrorByRequestId((prev) => ({
      ...prev,
      [request.id]: null,
    }));

    const supabase = createSupabaseBrowserClient();
    const { start, end } = resolveRequestPeriod(request);
    let query = supabase
      .from("attendance_records")
      .select("id, log_date, log_time, log_type, log_source, site_name")
      .eq("import_id", request.attendance_import_id)
      .eq("employee_name", request.employee_name);

    if (start) {
      query = query.gte("log_date", start);
    }

    if (end) {
      query = query.lte("log_date", end);
    }

    const { data, error } = await query
      .order("log_date", { ascending: true })
      .order("log_time", { ascending: true })
      .limit(150);

    if (error) {
      setEmployeeLogsByRequestId((prev) => ({
        ...prev,
        [request.id]: [],
      }));
      setEmployeeLogsErrorByRequestId((prev) => ({
        ...prev,
        [request.id]: "Unable to load employee attendance logs.",
      }));
      setEmployeeLogsLoadingByRequestId((prev) => ({
        ...prev,
        [request.id]: false,
      }));
      return;
    }

    setEmployeeLogsByRequestId((prev) => ({
      ...prev,
      [request.id]: (data ?? []) as AttendanceLogRow[],
    }));
    setEmployeeLogsLoadingByRequestId((prev) => ({
      ...prev,
      [request.id]: false,
    }));
  }

  async function openRequestLogs(request: PendingOvertimeRequest) {
    if (employeeLogsLoadingByRequestId[request.id]) return;

    if (
      employeeLogsByRequestId[request.id] ||
      employeeLogsErrorByRequestId[request.id]
    ) {
      setActiveLogsRequestId(request.id);
      return;
    }

    await loadEmployeeLogsForRequest(request);
    setActiveLogsRequestId(request.id);
  }

  function handleAction(adjustmentId: string, action: "approve" | "reject") {
    setPendingActionId(adjustmentId);
    setPendingActionType(action);
    startTransition(async () => {
      try {
        const result =
          action === "approve"
            ? await approveOvertimeAdjustmentAction(adjustmentId)
            : await rejectOvertimeAdjustmentAction(adjustmentId);

        toast.success(
          action === "approve"
            ? "Overtime request approved."
            : "Overtime request rejected.",
        );
        onRequestResolved?.(result.runId);
        setPendingRequests((prev) =>
          prev.map((request) =>
            request.id === adjustmentId
              ? {
                  ...request,
                  status: action === "approve" ? "approved" : "rejected",
                }
              : request,
          ),
        );
        window.dispatchEvent(new Event("payroll:pending-count-changed"));
        setEmployeeLogsByRequestId((prev) => {
          const next = { ...prev };
          delete next[adjustmentId];
          return next;
        });
        setEmployeeLogsLoadingByRequestId((prev) => {
          const next = { ...prev };
          delete next[adjustmentId];
          return next;
        });
        setEmployeeLogsErrorByRequestId((prev) => {
          const next = { ...prev };
          delete next[adjustmentId];
          return next;
        });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to update overtime request.",
        );
      } finally {
        setPendingActionId(null);
        setPendingActionType(null);
      }
    });
  }

  if (!roleLoading && role !== "ceo") return null;

  return (
    <section className="rounded-[14px] border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-widest text-apple-steel">
            CEO Approval Queue
          </p>
          <h2 className="mt-1 text-xl font-bold text-apple-charcoal">
            Pending Overtime Requests
          </h2>
          <p className="mt-1 text-sm text-apple-smoke">
            Review overtime requests while payroll stays saved and visible in
            history.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          <Clock3 size={14} />
          {pendingCount} pending
        </span>
      </div>

      <div className="mt-4">
        {loading ? (
          <ApprovalQueueSkeleton />
        ) : !hasRequests ? (
          <p className="text-sm text-apple-steel">
            No overtime requests are waiting for approval.
          </p>
        ) : (
          <div className="grid items-stretch gap-3 md:grid-cols-2 ">
            {pendingRequests.map((request) => {
              const run = getRelationValue(request.payroll_runs);
              const rowBusy = isPending && pendingActionId === request.id;
              const isResolved = request.status !== "pending";
              const rejectBusy = rowBusy && pendingActionType === "reject";
              const approveBusy = rowBusy && pendingActionType === "approve";
              const siteLabel =
                run?.site_name?.trim() ||
                request.site_name?.trim() ||
                "Unknown Site";
              const employeeLabel =
                request.employee_name ?? "Unknown Employee";
              const periodLabel =
                run?.period_label ?? request.period_label ?? "Unknown Period";
              const requestDailyLogs = buildRequestDailyLogRows(
                request,
                employeeLogsByRequestId[request.id] ?? [],
              );

              return (
                <div
                  key={request.id}
                  className="group flex h-full w-full max-w-full flex-col rounded-2xl border border-apple-mist bg-[rgb(var(--apple-snow))] p-5 shadow-[0_8px_20px_rgba(24,83,43,0.04)] transition-all"
                >
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-[15px] font-bold tracking-tight text-apple-charcoal">
                        {employeeLabel}
                      </h3>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset",
                          request.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200/40"
                            : request.status === "rejected"
                              ? "bg-rose-50 text-rose-700 ring-rose-200/40"
                              : "bg-amber-50 text-amber-700 ring-amber-200/40",
                        )}
                      >
                        {request.status === "approved" ? (
                          <>
                            <CheckCircle2 size={12} strokeWidth={2.5} />
                            Approved
                          </>
                        ) : request.status === "rejected" ? (
                          <>
                            <XCircle size={12} strokeWidth={2.5} />
                            Rejected
                          </>
                        ) : (
                          <>
                            <Clock3 size={12} strokeWidth={2.5} />
                            Pending Approval
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-apple-steel">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-apple-smoke" />
                        {siteLabel}
                      </div>
                      <div className="hidden h-3 w-px bg-apple-mist lg:block" />
                      <div className="font-medium">{periodLabel}</div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] font-medium text-apple-smoke/80">
                        Requested {formatRequestedAt(request.created_at)}
                      </p>
                      {request.notes && (
                        <div className="relative rounded-xl border border-apple-mist/50 bg-blue-50 px-3.5 py-2.5 text-xs italic shadow-sm">
                          &quot;{request.notes}&quot;
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          void openRequestLogs(request);
                        }}
                        disabled={Boolean(employeeLogsLoadingByRequestId[request.id])}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-apple-mist bg-white px-3 py-1.5 text-[11px] font-semibold text-apple-charcoal transition hover:border-apple-steel disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {employeeLogsLoadingByRequestId[request.id] ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            Loading Logs...
                          </>
                        ) : (
                          "View Employee Logs"
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-apple-mist bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-apple-steel/80">
                      Overtime Pay
                    </p>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-black tracking-tight text-apple-charcoal">
                        {formatMoney(request.amount)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-apple-smoke">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {request.quantity.toLocaleString("en-PH")} total hr
                      {request.quantity === 1 ? "" : "s"}
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-6">
                    <div className="text-[11px] italic text-apple-steel">
                      Review required before payroll cutoff
                    </div>
                    {isResolved ? (
                      <div
                        className={cn(
                          "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold",
                          request.status === "approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700",
                        )}
                      >
                        {request.status === "approved" ? (
                          <>
                            <CheckCircle2 size={15} />
                            Approved
                          </>
                        ) : (
                          <>
                            <XCircle size={15} />
                            Rejected
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAction(request.id, "reject")}
                          disabled={rowBusy}
                          className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-50 px-4 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:opacity-50"
                          aria-label={`Reject overtime request for ${request.employee_name ?? "employee"}`}
                        >
                          {rejectBusy ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <XCircle size={16} />
                          )}
                          Reject
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAction(request.id, "approve")}
                          disabled={rowBusy}
                          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1f6a37] px-5 text-xs font-bold text-white shadow-md shadow-emerald-900/10 transition-all hover:bg-[#18552d] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                          aria-label={`Approve overtime request for ${request.employee_name ?? "employee"}`}
                        >
                          {approveBusy ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                          Approve Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeLogsRequestId
        ? (() => {
            const request = pendingRequests.find(
              (entry) => entry.id === activeLogsRequestId,
            );
            if (!request) return null;

            const run = getRelationValue(request.payroll_runs);
            const siteLabel =
              run?.site_name?.trim() ||
              request.site_name?.trim() ||
              "Unknown Site";
            const employeeLabel =
              request.employee_name ?? "Unknown Employee";
            const periodLabel =
              run?.period_label ?? request.period_label ?? "Unknown Period";

            return (
              <EmployeeLogsModal
                modalState={{
                  requestId: request.id,
                  employeeLabel,
                  siteLabel,
                  periodLabel,
                  requestDailyLogs: buildRequestDailyLogRows(
                    request,
                    employeeLogsByRequestId[request.id] ?? [],
                  ),
                  loading: Boolean(employeeLogsLoadingByRequestId[request.id]),
                  error: employeeLogsErrorByRequestId[request.id] ?? null,
                }}
                onClose={() => setActiveLogsRequestId(null)}
              />
            );
          })()
        : null}
    </section>
  );
}
