function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[linear-gradient(90deg,rgba(232,242,236,0.95),rgba(244,249,246,1),rgba(232,242,236,0.95))] bg-[length:200%_100%] ${className}`}
    />
  );
}

export default function CostEstimatorPageSkeleton() {
  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-apple-mist bg-white/95 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="flex min-h-[48px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <SkeletonBlock className="h-11 w-36 rounded-[10px]" />
            <SkeletonBlock className="h-11 w-[280px] rounded-[10px]" />
            <SkeletonBlock className="h-9 w-32 rounded-full" />
            <SkeletonBlock className="h-8 w-20 rounded-full" />
          </div>
          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <SkeletonBlock className="h-11 w-32 rounded-[10px]" />
            <SkeletonBlock className="h-11 w-32 rounded-[10px]" />
            <SkeletonBlock className="h-11 w-36 rounded-[10px]" />
          </div>
        </div>
      </header>

      <section className="grid min-h-[calc(100vh-69px)] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5 px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <SkeletonBlock className="h-10 w-60 max-w-full" />
              <SkeletonBlock className="h-4 w-[30rem] max-w-full" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SkeletonBlock className="h-11 w-28 rounded-[10px]" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <SkeletonBlock className="h-7 w-44" />
                <SkeletonBlock className="h-4 w-20" />
              </div>
              <SkeletonBlock className="h-11 w-28 rounded-[10px]" />
            </div>

            <div className="min-h-[520px] py-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`cost-estimator-item-skeleton-${index}`}
                    className="rounded-[14px] border border-apple-mist bg-white p-4 shadow-[0_8px_20px_rgba(24,83,43,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <SkeletonBlock className="h-3 w-20" />
                        <div className="mt-2 flex items-center gap-2">
                          <SkeletonBlock className="h-8 w-8 rounded-full" />
                          <SkeletonBlock className="h-6 w-36" />
                        </div>
                      </div>
                      <SkeletonBlock className="h-9 w-9 rounded-full" />
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <SkeletonBlock className="h-4 w-20" />
                      <SkeletonBlock className="h-5 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="min-h-full border-t border-apple-mist bg-white px-5 py-6 xl:border-t-0 xl:border-l">
          <div className="flex items-start justify-between gap-3">
            <SkeletonBlock className="h-9 w-36" />
            <SkeletonBlock className="h-8 w-20 rounded-full" />
          </div>

          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-10 w-40" />
            </div>

            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-9 w-32" />
            </div>

            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-9 w-14" />
            </div>

            <div className="rounded-[16px] border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 py-4">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="mt-2 h-4 w-4/5" />
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
