import { RefreshCw } from "lucide-react";
import DashboardPageHero from "@/components/DashboardPageHero";
import EstimateReviewsSectionSkeleton from "@/features/cost-estimator/components/EstimateReviewsSectionSkeleton";

export default function Loading() {
  return (
    <div className="p-6">
      <DashboardPageHero
        eyebrow="CEO Review"
        title="Estimate Reviews"
        description="Review engineer-submitted project estimates before bidding and push approved totals into Budget Tracker as new projects."
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
      <EstimateReviewsSectionSkeleton />
    </div>
  );
}
