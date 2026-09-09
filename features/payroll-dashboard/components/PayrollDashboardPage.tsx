import Link from "next/link";
import { Upload } from "lucide-react";
import DashboardPageHero from "@/components/DashboardPageHero";
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
    <main className="min-h-full bg-white px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <DashboardPageHero eyebrow="Payroll workspace" title="Payroll Dashboard" description="Review attendance, prepare payroll, and track approvals." actions={<Link
          href="/upload-attendance"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#076d69] shadow-sm transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-fit"
        >
          <Upload size={16} /> Upload Attendance
        </Link>} />

      <div className="mt-5"><PayrollDashboardSummaryCards summary={data.summary} /></div>

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

      <div className="mt-4 grid grid-cols-1 gap-4">
        <PayrollApprovalsPanel approvals={data.awaitingApprovals} />
        <PayrollRecentActivityPanel items={data.recentActivity} />
      </div>
    </main>
  );
}
