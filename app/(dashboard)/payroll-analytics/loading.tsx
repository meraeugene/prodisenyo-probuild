import DashboardPageHero from "@/components/DashboardPageHero";
import { PayrollAnalyticsLoadingState } from "@/features/analytics/components/PayrollAnalyticsLoadingState";
export default function Loading() {
  return <div role="status" aria-label="Loading payroll analytics" className="space-y-4 p-0 sm:p-6"><DashboardPageHero eyebrow="Data Analytics" title="Payroll Analytics" /><PayrollAnalyticsLoadingState /></div>;
}
