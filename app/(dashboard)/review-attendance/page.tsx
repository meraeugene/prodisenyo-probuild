"use client";

import { useEffect } from "react";
import AttendanceWorkflowSkeleton from "@/features/attendance/components/AttendanceWorkflowSkeleton";
import { useRouter } from "next/navigation";
import AttendanceReviewSection from "@/features/attendance/components/AttendanceReviewSection";
import { useAppState } from "@/features/app/AppStateProvider";
import PayrollWorkflowNavigation from "@/features/payroll/components/generate-payroll/PayrollWorkflowNavigation";

export default function ReviewAttendancePage() {
  const router = useRouter();
  const { hydrated, records, site, attendance, workspaceReset } = useAppState();

  useEffect(() => {
    if (hydrated && (workspaceReset || records.length === 0)) {
      router.replace("/upload-attendance");
    }
  }, [hydrated, records.length, router, workspaceReset]);

  if (!hydrated || workspaceReset || records.length === 0) {
    return <AttendanceWorkflowSkeleton step={2} />;
  }

  return (
    <div className="p-0">
      <PayrollWorkflowNavigation current={2} />
      <div className="px-4 py-6 sm:px-6 xl:px-7">
        <AttendanceReviewSection
          step={records.length > 0 ? 2 : 1}
          site={site}
          records={records}
          attendance={attendance}
        />
      </div>
    </div>
  );
}
