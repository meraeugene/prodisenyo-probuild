import { useEffect, useRef, useState } from "react";
import { getPayrollManagerOvertimeNotificationsAction, getPayrollManagerReportNotificationsAction } from "@/actions/payroll";
import { parseOvertimeRequestNotes } from "../utils/overtimeRequestNotes";
import type { AppRole, PayrollRunStatus } from "@/types/database";

type Props = { role: AppRole | null; currentPayrollRunId: string | null; setCurrentPayrollRunMeta: (value: { id: string | null; status: PayrollRunStatus | null }) => void };

export function usePayrollManagerNotifications({ role, currentPayrollRunId, setCurrentPayrollRunMeta }: Props) {
  const [rejectionAlert, setRejectionAlert] = useState<{
    reportId: string;
    siteName: string;
    periodLabel: string;
    rejectionReason: string | null;
  } | null>(null);

  const [overtimeRejectionAlert, setOvertimeRejectionAlert] = useState<{
    requestId: string;
    employeeName: string;
    siteName: string;
    periodLabel: string;
    rejectionReason: string | null;
  } | null>(null);

  const knownRejectionTimesRef = useRef<Record<string, string>>({});

  const knownOvertimeRejectionTimesRef = useRef<Record<string, string>>({});

  const canPlayNotificationSoundRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.sessionStorage.getItem(
        "generate-payroll:seen-rejection-times",
      );
      if (!raw) return;

      const parsed = JSON.parse(raw) as Record<string, string>;
      knownRejectionTimesRef.current = parsed;
    } catch {
      knownRejectionTimesRef.current = {};
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.sessionStorage.getItem(
        "generate-payroll:seen-overtime-rejection-times",
      );
      if (!raw) return;

      const parsed = JSON.parse(raw) as Record<string, string>;
      knownOvertimeRejectionTimesRef.current = parsed;
    } catch {
      knownOvertimeRejectionTimesRef.current = {};
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      canPlayNotificationSoundRef.current = true;
    }, 1000);

    let cancelled = false;

    async function loadPayrollNotifications() {
      if (cancelled || document.hidden || role !== "payroll_manager") return;

      try {
        const [response, overtimeResponse] = await Promise.all([
          getPayrollManagerReportNotificationsAction(),
          getPayrollManagerOvertimeNotificationsAction(),
        ]);
        if (cancelled) return;

        const currentRunNotification = response.reports.find(
          (report) => report.id === currentPayrollRunId,
        );

        if (currentRunNotification) {
          setCurrentPayrollRunMeta({
            id: currentRunNotification.id,
            status: currentRunNotification.status,
          });
        }

        const latestFreshRejection = response.reports
          .filter(
            (report) => report.status === "rejected" && report.rejected_at,
          )
          .sort(
            (left, right) =>
              new Date(right.rejected_at as string).getTime() -
              new Date(left.rejected_at as string).getTime(),
          )
          .find((report) => {
            const known = knownRejectionTimesRef.current[report.id];
            return (
              !known ||
              new Date(report.rejected_at as string).getTime() >
                new Date(known).getTime()
            );
          });

        response.reports.forEach((report) => {
          if (report.rejected_at) {
            knownRejectionTimesRef.current[report.id] = report.rejected_at;
          }
        });

        window.sessionStorage.setItem(
          "generate-payroll:seen-rejection-times",
          JSON.stringify(knownRejectionTimesRef.current),
        );

        if (latestFreshRejection) {
          setRejectionAlert({
            reportId: latestFreshRejection.id,
            siteName: latestFreshRejection.site_name,
            periodLabel: latestFreshRejection.period_label,
            rejectionReason: latestFreshRejection.rejection_reason,
          });

          if (canPlayNotificationSoundRef.current) {
            const audio = new Audio("/sounds/overtime-approval.mp3");
            audio.volume = 0.9;
            void audio.play().catch(() => undefined);
          }
        }

        const latestFreshOvertimeRejection = overtimeResponse.requests
          .filter((request) => request.status === "rejected")
          .sort(
            (left, right) =>
              new Date(right.updated_at).getTime() -
              new Date(left.updated_at).getTime(),
          )
          .find((request) => {
            const known = knownOvertimeRejectionTimesRef.current[request.id];
            return (
              !known ||
              new Date(request.updated_at).getTime() > new Date(known).getTime()
            );
          });

        overtimeResponse.requests.forEach((request) => {
          knownOvertimeRejectionTimesRef.current[request.id] =
            request.updated_at;
        });

        window.sessionStorage.setItem(
          "generate-payroll:seen-overtime-rejection-times",
          JSON.stringify(knownOvertimeRejectionTimesRef.current),
        );

        if (latestFreshOvertimeRejection) {
          const parsedNotes = parseOvertimeRequestNotes(
            latestFreshOvertimeRejection.notes,
          );
          setOvertimeRejectionAlert({
            requestId: latestFreshOvertimeRejection.id,
            employeeName:
              latestFreshOvertimeRejection.employee_name ?? "Unknown Employee",
            siteName: latestFreshOvertimeRejection.site_name ?? "",
            periodLabel: latestFreshOvertimeRejection.period_label ?? "",
            rejectionReason: parsedNotes.rejectionReason,
          });

          if (canPlayNotificationSoundRef.current) {
            const audio = new Audio("/sounds/overtime-approval.mp3");
            audio.volume = 0.9;
            void audio.play().catch(() => undefined);
          }
        }
      } catch {
        // Keep polling silent so intermittent failures do not interrupt payroll work.
      }
    }

    void loadPayrollNotifications();

    const intervalId = window.setInterval(() => {
      void loadPayrollNotifications();
    }, 30000);

    function handleWindowFocus() {
      void loadPayrollNotifications();
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        void loadPayrollNotifications();
      }
    }

    function handlePageShow() {
      void loadPayrollNotifications();
    }

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [currentPayrollRunId, role, setCurrentPayrollRunMeta]);

  return { rejectionAlert, setRejectionAlert, overtimeRejectionAlert, setOvertimeRejectionAlert };
}
