import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";

import { SkeletonBlock } from "@/components/LoadingSkeleton";


export default function MaterialRequestPageSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading content" className="space-y-4 overflow-x-hidden p-0 sm:p-6">
      <CeoPageHeroSkeleton action="none" />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="rounded-none border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(7,109,105,0.06)] sm:rounded-[18px]">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="mt-3 h-7 w-56" />
          <div className="mt-5 grid gap-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <SkeletonBlock
                key={`material-form-skeleton-${index}`}
                className="h-11 w-full rounded-xl"
              />
            ))}
            <SkeletonBlock className="h-20 w-full rounded-xl" />
            <SkeletonBlock className="h-11 w-36 rounded-[10px]" />
          </div>
        </div>

        <div className="rounded-none border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(7,109,105,0.06)] sm:rounded-[18px]">
          <SkeletonBlock className="h-3 w-28" />
          <SkeletonBlock className="mt-3 h-7 w-64" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`material-row-skeleton-${index}`}
                className="rounded-none border border-apple-mist bg-[rgb(var(--apple-snow))] p-4 sm:rounded-[14px]"
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
