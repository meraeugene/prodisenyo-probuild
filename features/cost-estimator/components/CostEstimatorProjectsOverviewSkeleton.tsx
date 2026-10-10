import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";

import { SkeletonBlock } from "@/components/LoadingSkeleton";


export default function CostEstimatorProjectsOverviewSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading content" className="space-y-5 p-4 sm:p-6">
      <CeoPageHeroSkeleton action="none" />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={`metric-skeleton-${index}`} data-skeleton-panel="true" className="skeleton-surface flex min-h-[126px] items-center gap-5 rounded-[14px] px-7 py-6">
            
            <div className="space-y-2">
              <SkeletonBlock className="h-8 w-12" />
              <SkeletonBlock className="h-4 w-20" />
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-4 px-3 sm:px-2">
        <SkeletonBlock className="h-8 w-48" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <article key={`project-skeleton-${index}`} data-skeleton-panel="true" className="skeleton-surface flex min-h-[474px] flex-col rounded-[14px] p-6">
              <div className="flex items-center justify-between">
                <SkeletonBlock className="h-7 w-24 rounded-full" />
                <SkeletonBlock className="h-7 w-20" />
              </div>
              <SkeletonBlock className="mt-5 h-8 w-40" />
              <div className="mt-7 space-y-4">
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-5/6" />
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-4/5" />
              </div>
              <SkeletonBlock className="mt-8 h-3 w-full rounded-full" />
              <div className="mt-auto pt-7">
                <SkeletonBlock className="h-12 w-full" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
