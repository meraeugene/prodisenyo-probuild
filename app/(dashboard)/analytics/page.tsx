"use client";

import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import PayrollInsightsDashboard from "@/components/PayrollInsightsDashboard";
import { useAppState } from "@/features/app/AppStateProvider";

export default function AnalyticsPage() {
  const { payroll } = useAppState();
  const hasPayrollAnalyticsData =
    payroll.payrollRows.length > 0 && payroll.payrollAttendanceInputs.length > 0;

  return (
    <div className="space-y-4">
      <DashboardPageHero
        eyebrow="Data Analytics"
        title="Payroll Analytics"
        description="Track payroll distribution, employee compensation, project costs, and payroll insights for the selected pay period."
      />
      {hasPayrollAnalyticsData ? (
        <PayrollInsightsDashboard
          payrollRows={payroll.payrollRows}
          attendanceRows={payroll.payrollAttendanceInputs}
        />
      ) : (
        <section className="rounded-[14px] border border-apple-mist bg-white p-6 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
          <p className="text-sm text-apple-smoke">
            Upload attendance files first to view payroll analytics.
          </p>
        </section>
      )}
    </div>
  );
}
