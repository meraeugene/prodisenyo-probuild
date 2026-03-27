"use client";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-apple-mist/70 ${className}`} />;
}

export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-5">
      <section className="rounded-[16px] bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] p-6 shadow-[0_18px_36px_rgba(22,101,52,0.18)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-40 bg-white/15" />
            <SkeletonBlock className="h-12 w-72 bg-white/20" />
          </div>
          <div className="flex flex-wrap gap-2">
            <SkeletonBlock className="h-10 w-28 bg-white/15" />
            <SkeletonBlock className="h-10 w-24 bg-white/15" />
            <SkeletonBlock className="h-10 w-20 bg-white/15" />
            <SkeletonBlock className="h-10 w-10 bg-white/15" />
          </div>
        </div>
      </section>

      <section className="rounded-[12px] bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
        <div className="mb-5 space-y-2">
          <SkeletonBlock className="h-5 w-44" />
          <SkeletonBlock className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="rounded-[12px] border border-apple-mist bg-[rgb(var(--apple-snow))] p-4">
            <div className="mb-4 space-y-2">
              <SkeletonBlock className="h-4 w-36" />
              <SkeletonBlock className="h-3 w-28" />
            </div>
            <SkeletonBlock className="h-[260px] w-full" />
          </div>
          <div className="rounded-[12px] border border-apple-mist bg-[rgb(var(--apple-snow))] p-4">
            <div className="mb-4 space-y-2">
              <SkeletonBlock className="h-4 w-44" />
              <SkeletonBlock className="h-3 w-24" />
            </div>
            <SkeletonBlock className="h-[260px] w-full" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`overview-kpi-skeleton-${index}`}
            className="rounded-[22px] bg-white p-6 shadow-[0_18px_40px_rgba(24,83,43,0.08)]"
          >
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-11 w-11 rounded-2xl" />
              <SkeletonBlock className="h-7 w-20 rounded-full" />
            </div>
            <SkeletonBlock className="mt-6 h-10 w-36" />
            <SkeletonBlock className="mt-3 h-4 w-32" />
          </div>
        ))}
      </section>

      <section className="rounded-[12px] bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
        <div className="mb-4">
          <SkeletonBlock className="h-5 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`department-card-skeleton-${index}`}
              className="rounded-[16px] bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] p-5 shadow-[0_18px_36px_rgba(22,101,52,0.16)]"
            >
              <SkeletonBlock className="h-4 w-28 bg-white/20" />
              <SkeletonBlock className="mt-8 h-8 w-20 bg-white/20" />
              <SkeletonBlock className="mt-8 h-9 w-36 bg-white/20" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AnalyticsPageSkeleton() {
  return (
    <div className="space-y-4">
      <section className="rounded-[16px] bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] p-6 shadow-[0_18px_36px_rgba(22,101,52,0.18)]">
        <div className="space-y-3">
          <SkeletonBlock className="h-3 w-28 bg-white/15" />
          <SkeletonBlock className="h-12 w-72 bg-white/20" />
          <SkeletonBlock className="h-5 w-[32rem] max-w-full bg-white/15" />
        </div>
      </section>

      <section className="rounded-[14px] border border-apple-mist bg-white p-6 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <SkeletonBlock className="h-[280px] w-full" />
          <SkeletonBlock className="h-[280px] w-full" />
        </div>
      </section>

      <section className="rounded-[14px] border border-apple-mist bg-white p-6 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
        <SkeletonBlock className="h-[240px] w-full" />
      </section>
    </div>
  );
}
