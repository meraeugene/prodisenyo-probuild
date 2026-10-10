"use client";

export default function EstimateReviewsTableSkeleton() {
  return (
    <section
      data-skeleton-panel="true" className="skeleton-surface mt-4 rounded-[18px] p-5"
      aria-hidden="true"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="animate-pulse motion-reduce:animate-none space-y-3">
          <div className="h-3 w-24 rounded-full skeleton-placeholder" />
          <div className="h-7 w-72 rounded-full skeleton-placeholder" />
        </div>
        <div className="h-7 w-24 animate-pulse motion-reduce:animate-none rounded-full skeleton-placeholder" />
      </div>

      <div className="overflow-hidden rounded-[18px]">
        <div className="grid grid-cols-[1.5fr_1fr_1.2fr_1.2fr_0.9fr_0.8fr_1fr] gap-3 px-3 py-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={`estimate-review-header-skeleton-${index}`}
              className="h-3 animate-pulse motion-reduce:animate-none rounded-full skeleton-placeholder"
            />
          ))}
        </div>

        <div className="divide-y divide-apple-mist">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`estimate-review-row-skeleton-${index}`}
              className="grid grid-cols-[1.5fr_1fr_1.2fr_1.2fr_0.9fr_0.8fr_1fr] items-center gap-3 px-3 py-4"
            >
              <div className="animate-pulse motion-reduce:animate-none space-y-2">
                <div className="h-4 w-32 rounded-full skeleton-placeholder" />
                <div className="h-3 w-24 rounded-full skeleton-placeholder" />
              </div>
              <div className="h-4 animate-pulse motion-reduce:animate-none rounded-full skeleton-placeholder" />
              <div className="h-4 animate-pulse motion-reduce:animate-none rounded-full skeleton-placeholder" />
              <div className="h-4 animate-pulse motion-reduce:animate-none rounded-full skeleton-placeholder" />
              <div className="ml-auto h-4 w-24 animate-pulse motion-reduce:animate-none rounded-full skeleton-placeholder" />
              <div className="mx-auto h-7 w-24 animate-pulse motion-reduce:animate-none rounded-full skeleton-placeholder" />
              <div className="ml-auto flex justify-end gap-2">
                <div className="h-9 w-20 animate-pulse motion-reduce:animate-none rounded-lg skeleton-placeholder" />
                <div className="h-9 w-20 animate-pulse motion-reduce:animate-none rounded-lg skeleton-placeholder" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
