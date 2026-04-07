"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import type {
  HistoricalDashboardAttendanceLog,
  HistoricalDashboardDailyTotal,
  HistoricalDashboardPayrollItem,
} from "@/features/dashboard/hooks/useHistoricalDashboardData";
import CeoEmployeeLogsModal from "@/features/dashboard/components/CeoEmployeeLogsModal";
import CeoSiteLogsModal from "@/features/dashboard/components/CeoSiteLogsModal";
import {
  ModalShell,
  SummaryStat,
} from "@/features/dashboard/components/CeoDepartmentReviewModalParts";
import {
  formatPeso,
  normalizeKey,
  round2,
  splitSiteNames,
} from "@/features/dashboard/utils/ceoDepartmentReviewHelpers";

interface CeoSiteReviewModalProps {
  siteName: string;
  attendancePeriod: string;
  payrollItems: HistoricalDashboardPayrollItem[];
  attendanceLogs: HistoricalDashboardAttendanceLog[];
  dailyTotals: HistoricalDashboardDailyTotal[];
  onClose: () => void;
}

export default function CeoSiteReviewModal({
  siteName,
  attendancePeriod,
  payrollItems,
  attendanceLogs,
  dailyTotals,
  onClose,
}: CeoSiteReviewModalProps) {
  const [search, setSearch] = useState("");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [showAllSiteLogs, setShowAllSiteLogs] = useState(false);

  const siteItems = useMemo(
    () =>
      payrollItems
        .filter((item) =>
          splitSiteNames(item.site_name).some(
            (value) => normalizeKey(value) === normalizeKey(siteName),
          ),
        )
        .sort((a, b) => a.employee_name.localeCompare(b.employee_name)),
    [payrollItems, siteName],
  );

  const filteredItems = useMemo(() => {
    const term = normalizeKey(search);
    return siteItems.filter((item) => {
      if (!term) return true;
      return normalizeKey(item.employee_name).includes(term);
    });
  }, [search, siteItems]);

  const siteLogs = useMemo(
    () =>
      attendanceLogs.filter(
        (log) => normalizeKey(log.site_name) === normalizeKey(siteName),
      ),
    [attendanceLogs, siteName],
  );

  const sitePayrollTotal = useMemo(
    () =>
      round2(siteItems.reduce((sum, item) => sum + (item.total_pay ?? 0), 0)),
    [siteItems],
  );

  const activeItem =
    filteredItems.find((item) => item.id === activeItemId) ??
    siteItems.find((item) => item.id === activeItemId) ??
    null;

  return (
    <>
      <ModalShell
        title={siteName}
        eyebrow="Department Payroll Review"
        subtitle={`${attendancePeriod} | Read-only CEO review`}
        onClose={onClose}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryStat
              label="Employees"
              value={siteItems.length.toLocaleString("en-PH")}
            />
            <SummaryStat label="Total Payroll" value={formatPeso(sitePayrollTotal)} />
            <SummaryStat
              label="Attendance Logs"
              value={siteLogs.length.toLocaleString("en-PH")}
            />
          </div>

          <div className="rounded-xl border border-apple-mist bg-white">
            <div className="border-b border-apple-mist px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
                    Site Employees
                  </p>
                  <p className="mt-1 text-xs text-apple-steel">
                    Open any employee to review payroll details and attendance
                    logs. This view is read-only.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search employee..."
                    className="h-9 min-w-[220px] rounded-lg border border-apple-mist bg-white px-3 text-xs text-apple-charcoal outline-none transition focus:border-[#1f6a37]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAllSiteLogs(true)}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#1f6a37] bg-[#1f6a37] px-3 text-xs font-semibold text-white transition hover:bg-[#18532b]"
                  >
                    <Users size={14} />
                    All Site Logs
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-[520px] overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[rgb(var(--apple-snow))]">
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">Employee</th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">Role</th>
                    <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">Days</th>
                    <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">Hours</th>
                    <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">Paid</th>
                    <th className="px-3 py-2 text-center font-semibold uppercase tracking-wider text-apple-steel">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apple-mist">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-medium text-apple-charcoal">
                          {item.employee_name}
                        </td>
                        <td className="px-3 py-2 text-apple-smoke">{item.role_code}</td>
                        <td className="px-3 py-2 text-right text-apple-smoke">
                          {item.days_worked.toLocaleString("en-PH")}
                        </td>
                        <td className="px-3 py-2 text-right text-apple-smoke">
                          {item.hours_worked.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-apple-charcoal">
                          {formatPeso(item.total_pay)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => setActiveItemId(item.id)}
                            className="inline-flex rounded-lg border border-[#1f6a37] bg-[#1f6a37] px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-[#18532b]"
                          >
                            View Logs
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-apple-steel">
                        No employees match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ModalShell>

      {activeItem ? (
        <CeoEmployeeLogsModal
          attendancePeriod={attendancePeriod}
          item={activeItem}
          attendanceLogs={attendanceLogs}
          dailyTotals={dailyTotals}
          onClose={() => setActiveItemId(null)}
        />
      ) : null}

      {showAllSiteLogs ? (
        <CeoSiteLogsModal
          siteName={siteName}
          attendancePeriod={attendancePeriod}
          logs={siteLogs}
          onClose={() => setShowAllSiteLogs(false)}
        />
      ) : null}
    </>
  );
}
