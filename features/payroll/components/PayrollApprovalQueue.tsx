"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  approveOvertimeAdjustmentAction,
  rejectOvertimeAdjustmentAction,
} from "@/actions/payroll";

interface PendingOvertimeRequest {
  id: string;
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

function formatLogDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatLogTime(value: string): string {
  const date = new Date(`1970-01-01T${value}`);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function ApprovalQueueSkeleton() {
  return (
    <div className="mt-4 space-y-3" aria-hidden="true">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={`approval-skeleton-${index}`}
          className="rounded-2xl border border-apple-mist bg-[rgb(var(--apple-snow))] p-4"
        >
          <div className="animate-pulse space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="h-4 w-28 rounded-full bg-apple-mist" />
                  <div className="h-6 w-28 rounded-full bg-apple-mist/80" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="h-3 w-24 rounded-full bg-apple-mist/80" />
                  <div className="h-3 w-32 rounded-full bg-apple-mist/80" />
                  <div className="h-3 w-24 rounded-full bg-apple-mist/80" />
                </div>
                <div className="h-3 w-40 rounded-full bg-apple-mist/70" />
                <div className="h-10 w-full rounded-xl border border-apple-mist bg-white/80" />
              </div>

              <div className="rounded-xl border border-apple-mist bg-white px-4 py-3">
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded-full bg-apple-mist/70" />
                  <div className="h-7 w-24 rounded-full bg-apple-mist" />
                  <div className="h-3 w-14 rounded-full bg-apple-mist/80" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-apple-mist pt-4">
              <div className="h-10 w-24 rounded-[10px] bg-apple-mist/80" />
              <div className="h-10 w-24 rounded-[10px] bg-apple-mist" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PayrollApprovalQueue({
  role,
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
  const [expandedLogRequestIds, setExpandedLogRequestIds] = useState<
    Record<string, boolean>
  >({});
  const [employeeLogsByRequestId, setEmployeeLogsByRequestId] = useState<
    Record<string, AttendanceLogRow[]>
  >({});
  const [employeeLogsLoadingByRequestId, setEmployeeLogsLoadingByRequestId] =
    useState<Record<string, boolean>>({});
  const [employeeLogsErrorByRequestId, setEmployeeLogsErrorByRequestId] =
    useState<Record<string, string | null>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function loadPendingRequests() {
      if (role !== "ceo") {
        setPendingRequests([]);
        setExpandedLogRequestIds({});
        setEmployeeLogsByRequestId({});
        setEmployeeLogsLoadingByRequestId({});
        setEmployeeLogsErrorByRequestId({});
        setLoading(false);
        return;
      }

      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("payroll_adjustments")
        .select(
          "id, payroll_run_id, attendance_import_id, employee_name, role_code, site_name, period_label, quantity, amount, notes, created_at, effective_date, payroll_runs(site_name, period_label), payroll_run_items(employee_name, site_name)",
        )
        .eq("adjustment_type", "overtime")
        .eq("status", "pending")
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
  }, [role, refreshToken]);

  const hasRequests = useMemo(
    () => pendingRequests.length > 0,
    [pendingRequests.length],
  );

  async function loadEmployeeLogsForRequest(request: PendingOvertimeRequest) {
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
    const { data, error } = await supabase
      .from("attendance_records")
      .select("id, log_date, log_time, log_type, log_source, site_name")
      .eq("import_id", request.attendance_import_id)
      .eq("employee_name", request.employee_name)
      .order("log_date", { ascending: false })
      .order("log_time", { ascending: false })
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

  function toggleRequestLogs(request: PendingOvertimeRequest) {
    const isOpen = Boolean(expandedLogRequestIds[request.id]);
    const nextOpen = !isOpen;

    setExpandedLogRequestIds((prev) => ({
      ...prev,
      [request.id]: nextOpen,
    }));

    if (!nextOpen) return;
    if (employeeLogsByRequestId[request.id]) return;
    if (employeeLogsLoadingByRequestId[request.id]) return;

    void loadEmployeeLogsForRequest(request);
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
          prev.filter((request) => request.id !== adjustmentId),
        );
        setExpandedLogRequestIds((prev) => {
          const next = { ...prev };
          delete next[adjustmentId];
          return next;
        });
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

  if (role !== "ceo") return null;

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
          {pendingRequests.length} pending
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <ApprovalQueueSkeleton />
        ) : !hasRequests ? (
          <p className="text-sm text-apple-steel">
            No overtime requests are waiting for approval.
          </p>
        ) : (
          pendingRequests.map((request) => {
            const run = getRelationValue(request.payroll_runs);
            const item = getRelationValue(request.payroll_run_items);
            const rowBusy = isPending && pendingActionId === request.id;
            const rejectBusy = rowBusy && pendingActionType === "reject";
            const approveBusy = rowBusy && pendingActionType === "approve";
            const siteLabel =
              item?.site_name?.trim() ||
              request.site_name?.trim() ||
              run?.site_name ||
              "Unknown Site";
            const employeeLabel =
              item?.employee_name ?? request.employee_name ?? "Unknown Employee";
            const periodLabel =
              run?.period_label ?? request.period_label ?? "Unknown Period";

            return (
              <div
                key={request.id}
                className="group rounded-2xl border border-apple-mist bg-[rgb(var(--apple-snow))] p-5 shadow-[0_8px_20px_rgba(24,83,43,0.04)] transition-all w-fit"
              >
                <div className="grid gap-6 ">
                  <div className="min-w-0 space-y-3">
                    {/* Header: Name & Status */}
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-[15px] font-bold tracking-tight text-apple-charcoal">
                        {employeeLabel}
                      </h3>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-inset ring-amber-200/40">
                        <Clock3 size={12} strokeWidth={2.5} />
                        Pending Approval
                      </span>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-apple-steel">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-apple-smoke" />
                        {siteLabel}
                      </div>
                      <div className="hidden h-3 w-px bg-apple-mist lg:block" />
                      <div className="font-medium">
                        {periodLabel}
                      </div>
                    </div>

                    {/* Request Date & Notes */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-medium text-apple-smoke/80">
                        Requested {formatRequestedAt(request.created_at)}
                      </p>
                      {request.notes && (
                        <div className="relative rounded-xl border border-apple-mist/50 bg-blue-50 px-3.5 py-2.5 text-xs italic  shadow-sm">
                          &quot;{request.notes}&quot;
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleRequestLogs(request)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-apple-mist bg-white px-3 py-1.5 text-[11px] font-semibold text-apple-charcoal transition hover:border-apple-steel"
                      >
                        {expandedLogRequestIds[request.id] ? (
                          <>
                            Hide Employee Logs
                            <ChevronUp size={14} />
                          </>
                        ) : (
                          <>
                            View Employee Logs
                            <ChevronDown size={14} />
                          </>
                        )}
                      </button>

                      {expandedLogRequestIds[request.id] ? (
                        <div className="overflow-hidden rounded-xl border border-apple-mist bg-white">
                          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1.2fr] bg-[rgb(var(--apple-snow))] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-apple-steel">
                            <span>Date</span>
                            <span>Time</span>
                            <span>Type</span>
                            <span>Source</span>
                            <span>Site</span>
                          </div>

                          <div className="max-h-[220px] overflow-y-auto divide-y divide-apple-mist">
                            {employeeLogsLoadingByRequestId[request.id] ? (
                              <p className="px-3 py-4 text-xs text-apple-steel">
                                Loading attendance logs...
                              </p>
                            ) : employeeLogsErrorByRequestId[request.id] ? (
                              <p className="px-3 py-4 text-xs text-red-700">
                                {employeeLogsErrorByRequestId[request.id]}
                              </p>
                            ) : (employeeLogsByRequestId[request.id] ?? []).length ===
                              0 ? (
                              <p className="px-3 py-4 text-xs text-apple-steel">
                                No attendance logs found for this employee in the
                                linked import.
                              </p>
                            ) : (
                              (employeeLogsByRequestId[request.id] ?? []).map((log) => (
                                <div
                                  key={log.id}
                                  className="grid grid-cols-[1fr_1fr_1fr_1fr_1.2fr] items-center px-3 py-2 text-xs text-apple-charcoal"
                                >
                                  <span>{formatLogDate(log.log_date)}</span>
                                  <span>{formatLogTime(log.log_time)}</span>
                                  <span>{log.log_type}</span>
                                  <span>{log.log_source}</span>
                                  <span className="truncate">{log.site_name}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Financial Highlight Card */}
                  <div className="flex flex-col justify-center rounded-2xl border border-apple-mist bg-white p-4 shadow-sm lg:self-start">
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
                </div>

                {/* Footer Actions */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 ">
                  <div className="text-[11px] text-apple-steel italic">
                    Review required before payroll cutoff
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAction(request.id, "reject")}
                      disabled={rowBusy}
                      className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold text-red-600 transition-colors bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:opacity-50"
                      aria-label={`Reject overtime request for ${item?.employee_name ?? "employee"}`}
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
                      aria-label={`Approve overtime request for ${item?.employee_name ?? "employee"}`}
                    >
                      {approveBusy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      Approve Request
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
