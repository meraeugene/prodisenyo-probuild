function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[linear-gradient(90deg,rgba(232,242,236,0.95),rgba(244,249,246,1),rgba(232,242,236,0.95))] bg-[length:200%_100%] ${className}`}
    />
  );
}

export default function BudgetTrackerLoadingState() {
  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-apple-mist bg-white/95 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="flex min-h-[48px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <SkeletonBlock className="h-11 w-[240px] rounded-[10px] sm:w-[280px]" />
            <SkeletonBlock className="h-9 w-36 rounded-full" />
            <SkeletonBlock className="h-8 w-20 rounded-full" />
          </div>
          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <SkeletonBlock className="h-11 w-32 rounded-[10px]" />
            <SkeletonBlock className="h-11 w-28 rounded-[10px]" />
            <SkeletonBlock className="h-11 w-36 rounded-[10px]" />
          </div>
        </div>
      </header>

      <section className="grid min-h-[calc(100vh-69px)] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-5 p-4 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`budget-column-skeleton-${index}`} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <SkeletonBlock className="h-7 w-36" />
                  <SkeletonBlock className="h-4 w-24" />
                </div>
                <SkeletonBlock className="h-10 w-10 rounded-[10px]" />
              </div>

              <div className="min-h-[520px] rounded-[14px] border border-apple-mist bg-[rgb(var(--apple-snow))] p-3">
                <div className="flex min-h-[470px] items-center justify-center px-6">
                  <SkeletonBlock className="h-4 w-48 max-w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="self-stretch xl:border-l xl:border-apple-mist xl:p-4">
          <div className="h-full max-h-[calc(100vh-110px)] overflow-y-auto pr-2">
            <div className="flex items-start justify-between gap-3">
              <SkeletonBlock className="h-9 w-36" />
              <SkeletonBlock className="h-8 w-20 rounded-full" />
            </div>

            <div className="mt-7 space-y-5">
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-10 w-44" />
              </div>
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-9 w-24" />
              </div>
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="h-9 w-40" />
              </div>
            </div>

            <div className="mt-6 rounded-[12px] bg-emerald-50 px-4 py-4">
              <SkeletonBlock className="h-4 w-full bg-emerald-100" />
            </div>

            <div className="mt-6">
              <SkeletonBlock className="h-5 w-44" />
              <div className="mt-4 rounded-[12px] border border-dashed border-apple-mist px-4 py-5">
                <SkeletonBlock className="h-4 w-48 max-w-full" />
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
