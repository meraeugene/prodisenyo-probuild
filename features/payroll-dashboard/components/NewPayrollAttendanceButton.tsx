"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/features/app/AppStateProvider";

export default function NewPayrollAttendanceButton() {
  const router = useRouter();
  const { handleReset } = useAppState();

  function startNewPayrollAttendance() {
    handleReset();
    router.push("/upload-attendance");
  }

  return (
    <button
      type="button"
      onClick={startNewPayrollAttendance}
      className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/70 bg-white px-5 text-sm font-bold text-[#076d69] shadow-workspace-button transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#075e5b] md:w-auto"
    >
      <Plus size={17} />
      New Payroll Attendance
    </button>
  );
}
