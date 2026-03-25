"use client";

import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import AttendanceAnalyticsSection from "@/features/analytics/components/AttendanceAnalyticsSection";
import { useAppState } from "@/features/app/AppStateProvider";

export default function AttendanceAnalyticsPage() {
  const { employees, records } = useAppState();

  return (
    <div className="space-y-4">
      <DashboardPageHero
        eyebrow="Data Analytics"
        title="Attendance Analytics"
        description="Track attendance distribution, overtime trends, workforce coverage, and daily labor utilization across all sites."
      />

      {employees.length > 0 && records.length > 0 ? (
        <AttendanceAnalyticsSection employees={employees} records={records} />
      ) : (
        <section className="rounded-[14px] border border-apple-mist bg-white p-6 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
          <p className="text-sm text-apple-smoke">
            Upload attendance files first to view attendance analytics.
          </p>
        </section>
      )}
    </div>
  );
}
