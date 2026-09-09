import PayrollReportsArchiveSkeleton from "@/features/payroll-reports/components/PayrollReportsArchiveSkeleton";
export default function Loading() {
  return <div role="status" aria-label="Loading payroll approvals" className="min-h-full space-y-4 bg-[#f5f8f9] p-4 sm:p-6 lg:p-8"><header className="h-48 rounded-[22px] bg-[#075e5b]" /><div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div><PayrollReportsArchiveSkeleton /></div>;
}
