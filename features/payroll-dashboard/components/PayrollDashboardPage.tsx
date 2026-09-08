import Link from "next/link";
import { Upload } from "lucide-react";
import AttendanceBatchesPanel from "@/features/payroll-dashboard/components/AttendanceBatchesPanel";
import PayrollApprovalsPanel from "@/features/payroll-dashboard/components/PayrollApprovalsPanel";
import PayrollDashboardSummaryCards from "@/features/payroll-dashboard/components/PayrollDashboardSummaryCards";
import PayrollOverviewPanel from "@/features/payroll-dashboard/components/PayrollOverviewPanel";
import PayrollRecentActivityPanel from "@/features/payroll-dashboard/components/PayrollRecentActivityPanel";
import ReturnedSubmissionsPanel from "@/features/payroll-dashboard/components/ReturnedSubmissionsPanel";
import type { PayrollDashboardData } from "@/features/payroll-dashboard/types";

export default function PayrollDashboardPage({
  data,
}: {
  data: PayrollDashboardData;
}) {
  return (
    <main className="min-h-full bg-slate-50/40 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
            Payroll Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review attendance, prepare payroll, and track approvals.
          </p>
        </div>
        <Link
          href="/upload-attendance"
          className="inline-flex h-10 w-fit items-center gap-2 rounded-lg bg-[#076d69] px-4 text-sm font-bold text-white transition hover:bg-[#055f5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
        >
          <Upload size={16} /> Upload Attendance
        </Link>
      </header>

      <PayrollDashboardSummaryCards summary={data.summary} />

      {data.returnedSubmissions.length ? (
        <div className="mt-4">
          <ReturnedSubmissionsPanel submissions={data.returnedSubmissions} />
        </div>
      ) : null}

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.75fr)]">
        <AttendanceBatchesPanel batches={data.recentBatches} />
        <PayrollOverviewPanel
          overview={data.payrollOverview}
          hasOwnedAttendance={data.hasOwnedAttendance}
        />
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-2">
        <PayrollApprovalsPanel approvals={data.awaitingApprovals} />
        <PayrollRecentActivityPanel items={data.recentActivity} />
      </div>
    </main>
  );
}
