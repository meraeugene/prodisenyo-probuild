import DashboardPageHero from "@/components/DashboardPageHero";
import PayrollReportsArchiveSkeleton from "@/features/payroll-reports/components/PayrollReportsArchiveSkeleton";
export default function Loading() {
  return <div role="status" aria-label="Loading payroll approvals" className="p-0 sm:p-6"><DashboardPageHero eyebrow="CEO Review" title="Payroll Approvals" /><PayrollReportsArchiveSkeleton /></div>;
}
