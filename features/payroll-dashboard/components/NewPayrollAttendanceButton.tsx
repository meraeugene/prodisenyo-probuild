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
      className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(8,118,111,0.18)] transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 md:w-auto"
    >
      <Plus size={17} />
      New Payroll Attendance
    </button>
  );
}
