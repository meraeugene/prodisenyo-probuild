"use client";

import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import { AnalyticsPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeleton";
import PayrollInsightsDashboard from "@/components/PayrollInsightsDashboard";
import { useHistoricalDashboardData } from "@/features/dashboard/hooks/useHistoricalDashboardData";

export default function PayrollAnalyticsPageClient() {
  const { data, loading, error } = useHistoricalDashboardData();
  const payrollRows = data?.payrollRows ?? [];
  const attendanceRows = data?.payrollAttendanceInputs ?? [];
  const debug = data?.debug;
  const hasPayrollAnalyticsData =
    payrollRows.length > 0 && attendanceRows.length > 0;

  if (loading && !data && !error) {
    return <AnalyticsPageSkeleton />;
  }

  return (
    <div className="space-y-4">
      <DashboardPageHero
        eyebrow="Data Analytics"
        title="Payroll Analytics"
        description="Track payroll distribution, employee compensation, project costs, and payroll insights for the selected pay period."
      />
      {hasPayrollAnalyticsData ? (
        <PayrollInsightsDashboard
          payrollRows={payrollRows}
          attendanceRows={attendanceRows}
        />
      ) : error ? (
        <section className="rounded-[14px] border border-red-100 bg-red-50 p-6 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
          <p className="text-sm text-red-700">{error}</p>
          {debug ? (
            <p className="mt-2 text-xs text-red-600">
              Debug: runs={debug.payrollRunCount}, tracked_runs={debug.trackedPayrollRunCount}, run_items={debug.payrollRunItemCount}, attendance_records={debug.attendanceRecordCount}
            </p>
          ) : null}
        </section>
      ) : (
        <section className="rounded-[14px] border border-apple-mist bg-white p-6 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
          <p className="text-sm text-apple-smoke">
            No saved payroll runs are available yet.
          </p>
          {debug ? (
            <p className="mt-2 text-xs text-apple-steel">
              Debug: runs={debug.payrollRunCount}, tracked_runs={debug.trackedPayrollRunCount}, run_items={debug.payrollRunItemCount}, attendance_records={debug.attendanceRecordCount}
            </p>
          ) : null}
        </section>
      )}
    </div>
  );
}
