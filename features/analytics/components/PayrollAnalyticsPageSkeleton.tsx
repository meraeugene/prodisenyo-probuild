import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
import { PayrollAnalyticsLoadingState } from "./PayrollAnalyticsLoadingState";

export default function PayrollAnalyticsPageSkeleton() {
  return (
    <div className="min-h-full space-y-4 bg-white p-4 sm:p-6 lg:p-8">
      <CeoPageHeroSkeleton action="status" />
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 sm:px-5">
        <div><Block className="h-4 w-28" /><Block className="mt-2 h-3 w-64" /></div>
        <Block className="h-11 w-full sm:w-80" />
      </section>
      <PayrollAnalyticsLoadingState />
    </div>
  );
}
