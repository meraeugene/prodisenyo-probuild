"use client";

import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import { AnalyticsPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeleton";
import AttendanceAnalyticsSection from "@/features/analytics/components/AttendanceAnalyticsSection";
import { useHistoricalDashboardData } from "@/features/dashboard/hooks/useHistoricalDashboardData";

export default function AttendanceAnalyticsPageClient() {
  const { data, loading, error } = useHistoricalDashboardData();
  const employees = data?.employees ?? [];
  const records = data?.records ?? [];
  const debug = data?.debug;

  if (loading && !data && !error) {
    return <AnalyticsPageSkeleton />;
  }

  return (
    <div className="space-y-4">
      <DashboardPageHero
        eyebrow="Data Analytics"
        title="Attendance Analytics"
        description="Track attendance distribution, overtime trends, workforce coverage, and daily labor utilization across all sites."
      />

      {employees.length > 0 && records.length > 0 ? (
        <AttendanceAnalyticsSection employees={employees} records={records} />
      ) : error ? (
        <section className="rounded-[14px] border border-red-100 bg-red-50 p-6 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
          <p className="text-sm text-red-700">{error}</p>
          {debug ? (
            <p className="mt-2 text-xs text-red-600">
              Debug: imports={debug.attendanceImportCount}, records={debug.attendanceRecordCount}, employees={debug.employeeCount}, sites={debug.availableSiteCount}
            </p>
          ) : null}
        </section>
      ) : (
        <section className="rounded-[14px] border border-apple-mist bg-white p-6 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
          <p className="text-sm text-apple-smoke">
            No attendance history has been uploaded yet.
          </p>
          {debug ? (
            <p className="mt-2 text-xs text-apple-steel">
              Debug: imports={debug.attendanceImportCount}, records={debug.attendanceRecordCount}, employees={debug.employeeCount}, sites={debug.availableSiteCount}
            </p>
          ) : null}
        </section>
      )}
    </div>
  );
}
