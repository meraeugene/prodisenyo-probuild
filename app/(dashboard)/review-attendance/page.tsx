"use client";

import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import AttendanceReviewSection from "@/features/attendance/components/AttendanceReviewSection";
import { useAppState } from "@/features/app/AppStateProvider";

export default function ReviewAttendancePage() {
  const { records, site, attendance } = useAppState();

  return (
    <div className="space-y-4">
      <DashboardPageHero
        eyebrow="Attendance"
        title="Review Attendance"
        description="Check cleaned employee logs, verify branch records, and confirm attendance before payroll generation."
      />
      <AttendanceReviewSection
        step={records.length > 0 ? 2 : 1}
        site={site}
        records={records}
        attendance={attendance}
      />
    </div>
  );
}
