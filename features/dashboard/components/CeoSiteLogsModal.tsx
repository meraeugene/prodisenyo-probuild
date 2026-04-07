"use client";

import { useMemo, useState } from "react";
import type { HistoricalDashboardAttendanceLog } from "@/features/dashboard/hooks/useHistoricalDashboardData";
import {
  formatLogDate,
  formatLogTime,
  normalizeKey,
} from "@/features/dashboard/utils/ceoDepartmentReviewHelpers";
import {
  ModalShell,
  SummaryStat,
} from "@/features/dashboard/components/CeoDepartmentReviewModalParts";

interface CeoSiteLogsModalProps {
  siteName: string;
  attendancePeriod: string;
  logs: HistoricalDashboardAttendanceLog[];
  onClose: () => void;
}

export default function CeoSiteLogsModal({
  siteName,
  attendancePeriod,
  logs,
  onClose,
}: CeoSiteLogsModalProps) {
  const [search, setSearch] = useState("");

  const filteredLogs = useMemo(() => {
    const term = normalizeKey(search);
    return logs.filter((log) => {
      if (!term) return true;
      return normalizeKey(log.employee_name).includes(term);
    });
  }, [logs, search]);

  const employeeCount = new Set(
    filteredLogs.map((log) => normalizeKey(log.employee_name)),
  ).size;

  return (
    <ModalShell
      title={siteName}
      eyebrow="All Site Employee Logs"
      subtitle={`${attendancePeriod} | ${employeeCount.toLocaleString("en-PH")} employees with logs`}
      onClose={onClose}
      size="max-w-7xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryStat
            label="Log Rows"
            value={filteredLogs.length.toLocaleString("en-PH")}
          />
          <SummaryStat
            label="Employees"
            value={employeeCount.toLocaleString("en-PH")}
          />
          <SummaryStat label="Site" value={siteName} />
        </div>

        <div className="rounded-xl border border-apple-mist bg-white">
          <div className="border-b border-apple-mist px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
                Read-only Site Logs
              </p>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee..."
                className="h-9 min-w-[220px] rounded-lg border border-apple-mist bg-white px-3 text-xs text-apple-charcoal outline-none transition focus:border-[#1f6a37]"
              />
            </div>
          </div>

          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[rgb(var(--apple-snow))]">
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">Employee</th>
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">Date</th>
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">Time</th>
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">Type</th>
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-mist">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-3 py-2 font-medium text-apple-charcoal">
                        {log.employee_name}
                      </td>
                      <td className="px-3 py-2 text-apple-smoke">
                        {formatLogDate(log.log_date)}
                      </td>
                      <td className="px-3 py-2 text-apple-smoke">
                        {formatLogTime(log.log_time)}
                      </td>
                      <td className="px-3 py-2 text-apple-smoke">{log.log_type}</td>
                      <td className="px-3 py-2 text-apple-smoke">{log.log_source}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-apple-steel">
                      No site logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
