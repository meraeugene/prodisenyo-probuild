"use client";

import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardPageHero from "@/components/DashboardPageHero";
import AttendanceReviewSection from "@/features/attendance/components/AttendanceReviewSection";
import { useAppState } from "@/features/app/AppStateProvider";

export default function ReviewAttendancePage() {
  const router = useRouter();
  const { hydrated, records, site, attendance, workspaceReset } = useAppState();

  useEffect(() => {
    if (hydrated && (workspaceReset || records.length === 0)) {
      router.replace("/upload-attendance");
    }
  }, [hydrated, records.length, router, workspaceReset]);

  if (!hydrated || workspaceReset || records.length === 0) {
    return (
      <main className="min-h-full space-y-4 bg-white p-4 sm:p-6">
        <DashboardPageHero eyebrow="Attendance" title="Review Attendance" description="Preparing the latest attendance workspace." />
        <section className="flex min-h-52 items-center justify-center rounded-[22px] border border-white/80 bg-white/80 shadow-[0_14px_38px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="text-center"><LoaderCircle className="mx-auto animate-spin text-[#08746f]" size={24} /><p className="mt-3 text-sm font-medium text-slate-600">Loading attendance records...</p></div>
        </section>
      </main>
    );
  }

  return (
    <div className="space-y-4 p-0 sm:p-4">
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
