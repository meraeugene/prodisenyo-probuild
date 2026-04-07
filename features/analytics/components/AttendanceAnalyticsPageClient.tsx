"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import DashboardPageHero from "@/components/DashboardPageHero";
import AttendanceAnalyticsSection from "@/features/analytics/components/AttendanceAnalyticsSection";
import { useHistoricalDashboardData } from "@/features/dashboard/hooks/useHistoricalDashboardData";
import { AttendanceAnalyticsLoadingState } from "./AttendanceAnalyticsLoadingState";

export default function AttendanceAnalyticsPageClient() {
  const searchParams = useSearchParams();
  const { data, loading, error, selectedPeriodKey, setSelectedPeriodKey } =
    useHistoricalDashboardData({
      includeEmployees: false,
      includeAttendance: true,
      includePayrollItems: false,
      includePayrollDailyTotals: false,
    });
  const runIdFromQuery = searchParams.get("runId");
  const employees = data?.employees ?? [];
  const records = data?.records ?? [];
  const periodOptions = data?.periodOptions ?? [];
  const viewerRole = data?.viewerRole ?? null;
  const isCeo = viewerRole === "ceo";

  useEffect(() => {
    if (!runIdFromQuery) return;
    if (runIdFromQuery === selectedPeriodKey) return;
    setSelectedPeriodKey(runIdFromQuery);
  }, [runIdFromQuery, selectedPeriodKey, setSelectedPeriodKey]);

  return (
    <div className="space-y-4">
      <DashboardPageHero
        eyebrow="Data Analytics"
        title="Attendance Analytics"
        description="Track attendance distribution, overtime trends, workforce coverage, and daily labor utilization across all sites."
      />

      {periodOptions.length > 0 ? (
        <section className="rounded-[14px] border border-apple-mist bg-white p-4 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-apple-charcoal">
              Payroll Period
            </p>
            <select
              value={selectedPeriodKey ?? ""}
              onChange={(event) =>
                setSelectedPeriodKey(event.target.value || null)
              }
              className="h-11 min-w-[260px] rounded-[12px] border border-[#d9e2e6] bg-white px-3 text-sm text-[#334951] transition-all hover:border-[#0f6f74]/35 focus:border-[#0f6f74] focus:outline-none focus:ring-2 focus:ring-[#0f6f74]/10"
            >
              {periodOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label} - {option.siteName}
                </option>
              ))}
            </select>
          </div>
        </section>
      ) : null}

      {loading && !data && !error ? (
        <AttendanceAnalyticsLoadingState />
      ) : employees.length > 0 && records.length > 0 ? (
        <AttendanceAnalyticsSection employees={employees} records={records} />
      ) : error ? (
        <section className="rounded-[14px] border border-red-100 bg-red-50 p-6 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
          <p className="text-sm text-red-700">{error}</p>
        </section>
      ) : (
        <section className="rounded-[14px] border border-apple-mist bg-white p-6 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
          <p className="text-sm text-apple-smoke">
            {isCeo
              ? "No saved payroll periods yet."
              : "No attendance history has been uploaded yet."}
          </p>
        </section>
      )}
    </div>
  );
}
