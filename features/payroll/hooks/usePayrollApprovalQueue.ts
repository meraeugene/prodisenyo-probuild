"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import {
  approveOvertimeAdjustmentAction,
  getPendingOvertimeApprovalsAction,
  rejectOvertimeAdjustmentAction,
} from "@/actions/payroll";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { parseOvertimeRequestNotes } from "@/features/payroll/utils/overtimeRequestNotes";
import {
  buildRequestDailyLogRows,
  getRelationValue,
  resolveRequestPeriod,
  type AttendanceLogRow,
  type EmployeeLogsModalState,
  type PendingOvertimeRequest,
} from "@/features/payroll/utils/payrollApprovalQueueHelpers";
import type { AppRole } from "@/types/database";

interface UsePayrollApprovalQueueOptions {
  role: AppRole | null;
  roleLoading?: boolean;
  initialRequests?: PendingOvertimeRequest[];
  onRequestResolved?: (runId: string | null) => void;
}

export function usePayrollApprovalQueue({
  role,
  roleLoading = false,
  initialRequests = [],
  onRequestResolved,
}: UsePayrollApprovalQueueOptions) {
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
  const previousPendingCountRef = useRef<number | null>(null);
  const canPlayNotificationSoundRef = useRef(false);
  const approvalsState = useSWR(
    !roleLoading && role === "ceo" ? "pending-overtime-approvals" : null,
    getPendingOvertimeApprovalsAction,
    {
      fallbackData: {
        requests: initialRequests as unknown as Record<string, unknown>[],
      },
      refreshInterval: 15000,
      revalidateOnFocus: true,
    },
  );
  const pendingRequests = (approvalsState.data?.requests ??
    []) as unknown as PendingOvertimeRequest[];
  const hasRequests = useMemo(
    () => pendingRequests.length > 0,
    [pendingRequests.length],
  );
  const pendingCount = useMemo(
    () =>
      pendingRequests.filter((request) => request.status === "pending").length,
    [pendingRequests],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      canPlayNotificationSoundRef.current = true;
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const previousPendingCount = previousPendingCountRef.current;

    if (
      previousPendingCount !== null &&
      pendingCount > previousPendingCount &&
      canPlayNotificationSoundRef.current
    ) {
      const audio = new Audio("/sounds/overtime-approval.mp3");
      audio.volume = 0.9;
      void audio.play().catch(() => undefined);
    }

    previousPendingCountRef.current = pendingCount;
  }, [pendingCount]);

  async function loadEmployeeLogsForRequest(
    request: PendingOvertimeRequest,
  ): Promise<void> {
    if (!request.id) return;

    const parsedNotes = parseOvertimeRequestNotes(request.notes);
    if (parsedNotes.editedLogs.length > 0) {
      setEmployeeLogsByRequestId((prev) => ({ ...prev, [request.id]: [] }));
      setEmployeeLogsErrorByRequestId((prev) => ({
        ...prev,
        [request.id]: null,
      }));
      setEmployeeLogsLoadingByRequestId((prev) => ({
        ...prev,
        [request.id]: false,
      }));
      return;
    }

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
      setEmployeeLogsByRequestId((prev) => ({ ...prev, [request.id]: [] }));
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

  function handleAction(
    adjustmentId: string,
    action: "approve" | "reject",
    rejectionReason?: string,
  ) {
    setPendingActionId(adjustmentId);
    setPendingActionType(action);
    startTransition(async () => {
      try {
        const result =
          action === "approve"
            ? await approveOvertimeAdjustmentAction(adjustmentId)
            : await rejectOvertimeAdjustmentAction({
                adjustmentId,
                rejectionReason,
              });

        toast.success(
          action === "approve"
            ? "Overtime request approved."
            : "Overtime request rejected.",
        );
        onRequestResolved?.(result.runId);
        await approvalsState.mutate(
          (current) => ({
            requests:
              (current?.requests as PendingOvertimeRequest[] | undefined)?.map(
                (request) =>
                  request.id === adjustmentId
                    ? {
                        ...request,
                        status: action === "approve" ? "approved" : "rejected",
                      }
                    : request,
              ) ?? [],
          }),
          false,
        );
        void approvalsState.mutate();
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

  const activeLogsModalState = useMemo((): EmployeeLogsModalState | null => {
    if (!activeLogsRequestId) return null;

    const request = pendingRequests.find(
      (entry) => entry.id === activeLogsRequestId,
    );
    if (!request) return null;

    const run = getRelationValue(request.payroll_runs);
    const siteLabel =
      run?.site_name?.trim() || request.site_name?.trim() || "Unknown Site";
    const employeeLabel = request.employee_name ?? "Unknown Employee";
    const periodLabel =
      run?.period_label ?? request.period_label ?? "Unknown Period";

    return {
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
    };
  }, [
    activeLogsRequestId,
    employeeLogsByRequestId,
    employeeLogsErrorByRequestId,
    employeeLogsLoadingByRequestId,
    pendingRequests,
  ]);

  return {
    hasRequests,
    pendingCount,
    pendingRequests,
    isPending,
    pendingActionId,
    pendingActionType,
    employeeLogsLoadingByRequestId,
    refreshing: approvalsState.isValidating,
    openRequestLogs,
    handleAction,
    activeLogsModalState,
    closeLogsModal: () => setActiveLogsRequestId(null),
  };
}
