import DashboardPageHero from "@/components/DashboardPageHero";
import NewPayrollAttendanceButton from "@/features/payroll-dashboard/components/NewPayrollAttendanceButton";
import PayrollWorkspaceRunsPanel from "@/features/payroll-dashboard/components/PayrollWorkspaceRunsPanel";
import PayrollWorkspaceSummaryCards from "@/features/payroll-dashboard/components/PayrollWorkspaceSummaryCards";
import type { PayrollDashboardData } from "@/features/payroll-dashboard/types";

export default function PayrollWorkspacePage({ data }: { data: PayrollDashboardData }) {
  return (
    <main className="min-h-screen bg-white px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <DashboardPageHero
        eyebrow="Payroll workspace"
        title="Payroll Workspace"
        description="Continue payroll drafts, review approved payrolls, and start a new attendance-based payroll."
        actions={<NewPayrollAttendanceButton />}
      />
      <div className="mt-4"><PayrollWorkspaceSummaryCards data={data} /></div>
      <PayrollWorkspaceRunsPanel runs={data.workspaceRuns} />
    </main>
  );
}
