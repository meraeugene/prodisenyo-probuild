import DashboardPageHero from "@/components/DashboardPageHero";
import PayrollDashboardSummaryCards from "@/features/payroll-dashboard/components/PayrollDashboardSummaryCards";
import PayrollDraftsPanel from "@/features/payroll-dashboard/components/PayrollDraftsPanel";
import PayrollOverviewPanel from "@/features/payroll-dashboard/components/PayrollOverviewPanel";
import NewPayrollAttendanceButton from "@/features/payroll-dashboard/components/NewPayrollAttendanceButton";
import type { PayrollDashboardData } from "@/features/payroll-dashboard/types";

export default function PayrollDashboardPage({ data }: { data: PayrollDashboardData }) {
  return (
    <main className="min-h-full bg-[#f7faf9] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <DashboardPageHero
        eyebrow="Payroll workspace"
        title="Payroll Dashboard"
        description="Review attendance, prepare payroll, and track approvals."
        actions={<NewPayrollAttendanceButton />}
      />

      <div className="mt-4"><PayrollDashboardSummaryCards data={data} /></div>
      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,.75fr)]">
        <PayrollDraftsPanel drafts={data.payrollDrafts} />
        <PayrollOverviewPanel overview={data.payrollOverview} hasOwnedAttendance={data.hasOwnedAttendance} />
      </div>
    </main>
  );
}
