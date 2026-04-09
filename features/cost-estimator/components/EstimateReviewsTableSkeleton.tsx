"use client";

export default function EstimateReviewsTableSkeleton() {
  return (
    <section
      className="mt-4 rounded-[18px] border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.06)]"
      aria-hidden="true"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-24 rounded-full bg-apple-mist/80" />
          <div className="h-7 w-72 rounded-full bg-apple-mist" />
        </div>
        <div className="h-7 w-24 animate-pulse rounded-full bg-apple-mist/80" />
      </div>

      <div className="overflow-hidden rounded-[18px] border border-apple-mist">
        <div className="grid grid-cols-[1.5fr_1fr_1.2fr_1.2fr_0.9fr_0.8fr_1fr] gap-3 bg-[rgb(var(--apple-snow))] px-3 py-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={`estimate-review-header-skeleton-${index}`}
              className="h-3 animate-pulse rounded-full bg-apple-mist/80"
            />
          ))}
        </div>

        <div className="divide-y divide-apple-mist">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`estimate-review-row-skeleton-${index}`}
              className="grid grid-cols-[1.5fr_1fr_1.2fr_1.2fr_0.9fr_0.8fr_1fr] items-center gap-3 px-3 py-4"
            >
              <div className="animate-pulse space-y-2">
                <div className="h-4 w-32 rounded-full bg-apple-mist" />
                <div className="h-3 w-24 rounded-full bg-apple-mist/70" />
              </div>
              <div className="h-4 animate-pulse rounded-full bg-apple-mist/80" />
              <div className="h-4 animate-pulse rounded-full bg-apple-mist/80" />
              <div className="h-4 animate-pulse rounded-full bg-apple-mist/80" />
              <div className="ml-auto h-4 w-24 animate-pulse rounded-full bg-apple-mist" />
              <div className="mx-auto h-7 w-24 animate-pulse rounded-full bg-apple-mist/80" />
              <div className="ml-auto flex justify-end gap-2">
                <div className="h-9 w-20 animate-pulse rounded-lg bg-apple-mist/80" />
                <div className="h-9 w-20 animate-pulse rounded-lg bg-apple-mist/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
