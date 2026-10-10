import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";

import { SkeletonBlock } from "@/components/LoadingSkeleton";


function RequestFieldSkeleton({ multiline = false }: { multiline?: boolean }) {
  return <div className="grid gap-2"><SkeletonBlock className="h-5 w-28" /><SkeletonBlock className={multiline ? "h-[122px] w-full" : "h-11 w-full"} /></div>;
}

export default function MaterialRequestPageSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading content" className="space-y-4 overflow-x-hidden p-0 sm:p-6">
      <CeoPageHeroSkeleton actions={<SkeletonBlock className="h-10 w-28" />} />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div data-skeleton-panel="true" className="skeleton-surface rounded-none p-5 sm:rounded-[18px]">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="mt-2 h-7 w-56" />
          <div className="mt-4 grid gap-4">
            <RequestFieldSkeleton /><RequestFieldSkeleton />
            <div className="grid gap-4 md:grid-cols-2"><RequestFieldSkeleton /><RequestFieldSkeleton /></div>
            <div className="grid gap-4 md:grid-cols-2"><RequestFieldSkeleton /><RequestFieldSkeleton /></div>
            <RequestFieldSkeleton /><RequestFieldSkeleton multiline />
            <SkeletonBlock className="h-11 w-36 rounded-[10px]" />
          </div>
        </div>

        <div data-skeleton-panel="true" className="skeleton-surface rounded-none p-5 sm:rounded-[18px]">
          <SkeletonBlock className="h-3 w-28" />
          <SkeletonBlock className="mt-2 h-7 w-64" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`material-row-skeleton-${index}`}
                data-skeleton-panel="true" className="skeleton-surface rounded-none p-4 sm:rounded-[14px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <SkeletonBlock className="h-3 w-28" />
                    <SkeletonBlock className="h-6 w-40" />
                  </div>
                  <SkeletonBlock className="h-6 w-20 rounded-full" />
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <SkeletonBlock className="h-4 w-full" />
                  <SkeletonBlock className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
