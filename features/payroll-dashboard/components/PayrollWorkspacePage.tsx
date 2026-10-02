import NewPayrollAttendanceButton from "@/features/payroll-dashboard/components/NewPayrollAttendanceButton";
import PayrollWorkspaceRunsPanel from "@/features/payroll-dashboard/components/PayrollWorkspaceRunsPanel";
import PayrollWorkspaceSummaryCards from "@/features/payroll-dashboard/components/PayrollWorkspaceSummaryCards";
import type { PayrollDashboardData } from "@/features/payroll-dashboard/types";

export default function PayrollWorkspacePage({ data }: { data: PayrollDashboardData }) {
  return (
    <main className="min-h-full bg-[#f7faf9] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)] sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-teal-700">Payroll workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-[34px]">Payroll Workspace</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Continue payroll drafts, review approved payrolls, and start a new attendance-based payroll.</p>
          </div>
          <NewPayrollAttendanceButton showUploadIcon />
        </div>
      </section>
      <div className="mt-4"><PayrollWorkspaceSummaryCards data={data} /></div>
      <PayrollWorkspaceRunsPanel runs={data.workspaceRuns} />
    </main>
  );
}
