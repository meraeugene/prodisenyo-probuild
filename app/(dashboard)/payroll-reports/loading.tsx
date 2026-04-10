import { RefreshCw } from "lucide-react";
import DashboardPageHero from "@/components/DashboardPageHero";
import PayrollReportsArchiveSkeleton from "@/features/payroll-reports/components/PayrollReportsArchiveSkeleton";

export default function Loading() {
  return (
    <div className="p-6">
      <DashboardPageHero
        eyebrow="Payroll Reports"
        title="Payroll Report Review"
        description="Pending payroll reports stay here for CEO review. Only approved payroll reports flow into the CEO dashboard totals."
        actions={
          <button
            type="button"
            disabled
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[rgb(var(--theme-chart-5))] px-4 text-sm font-semibold text-[rgb(var(--apple-black))] opacity-60"
          >
            <RefreshCw size={14} />
            Sync
          </button>
        }
      />
      <PayrollReportsArchiveSkeleton />
    </div>
  );
}
