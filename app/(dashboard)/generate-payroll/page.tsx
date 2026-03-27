"use client";

import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import PayrollSection from "@/features/payroll/components/PayrollSection";
import { useAppState } from "@/features/app/AppStateProvider";

export default function PayrollPage() {
  const { attendance, payroll, handleGeneratePayroll, attendancePeriod } =
    useAppState();

  return (
    <div className="space-y-4">
      <DashboardPageHero
        eyebrow="Payroll"
        title="Generate Payroll"
        description="Review grouped employee rows, manage paid holidays and rates, then export the finished payroll report."
      />

      <PayrollSection
        attendancePeriod={attendancePeriod}
        dailyRowsCount={attendance.dailyRows.length}
        availableSites={attendance.availableSites}
        payroll={payroll}
        onGeneratePayroll={handleGeneratePayroll}
      />
    </div>
  );
}
