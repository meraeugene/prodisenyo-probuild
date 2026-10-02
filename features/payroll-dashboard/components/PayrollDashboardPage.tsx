import PayrollDashboardSummaryCards from "@/features/payroll-dashboard/components/PayrollDashboardSummaryCards";
import PayrollDraftsPanel from "@/features/payroll-dashboard/components/PayrollDraftsPanel";
import PayrollOverviewPanel from "@/features/payroll-dashboard/components/PayrollOverviewPanel";
import NewPayrollAttendanceButton from "@/features/payroll-dashboard/components/NewPayrollAttendanceButton";
import type { PayrollDashboardData } from "@/features/payroll-dashboard/types";

export default function PayrollDashboardPage({ data }: { data: PayrollDashboardData }) {
  return (
    <main className="min-h-full bg-[#f7faf9] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)] sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-teal-700">Payroll workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-[34px]">Payroll Dashboard</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Review attendance, prepare payroll, and track approvals.</p>
          </div>
          <NewPayrollAttendanceButton />
        </div>
      </section>

      <div className="mt-4"><PayrollDashboardSummaryCards data={data} /></div>
      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,.75fr)]">
        <PayrollDraftsPanel drafts={data.payrollDrafts} />
        <PayrollOverviewPanel overview={data.payrollOverview} hasOwnedAttendance={data.hasOwnedAttendance} />
      </div>
    </main>
  );
}
