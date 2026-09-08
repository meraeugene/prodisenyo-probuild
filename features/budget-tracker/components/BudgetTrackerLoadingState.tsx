function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[linear-gradient(90deg,rgba(230,250,247,0.95),rgba(240,253,250,1),rgba(230,250,247,0.95))] bg-[length:200%_100%] ${className}`}
    />
  );
}

export default function BudgetTrackerLoadingState() {
  return (
    <div className="space-y-4 overflow-x-hidden p-0 sm:p-6">
      <section className="rounded-none bg-[linear-gradient(135deg,#063b38,#075f5b,#087a75)] p-5 shadow-[0_18px_36px_rgba(7,109,105,0.18)] sm:rounded-[14px] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-28 bg-white/20" />
            <SkeletonBlock className="h-10 w-80 max-w-full bg-white/20" />
            <SkeletonBlock className="h-4 w-full max-w-[40rem] bg-white/15" />
          </div>
          <SkeletonBlock className="mt-3 h-10 w-36 rounded-xl bg-white/20 sm:mt-0" />
        </div>
      </section>

      <section className="rounded-none border border-apple-mist bg-white p-4 shadow-[0_10px_30px_rgba(7,109,105,0.06)] sm:rounded-[18px] sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-8 w-56" />
          </div>
          <SkeletonBlock className="h-7 w-24 rounded-full" />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <article
              key={`budget-project-card-skeleton-${index}`}
              className="rounded-[14px] border border-apple-mist bg-[rgb(var(--apple-snow))] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <SkeletonBlock className="h-3 w-20" />
                  <SkeletonBlock className="h-8 w-40" />
                </div>
                <SkeletonBlock className="h-7 w-14 rounded-full" />
              </div>

              <div className="mt-4 space-y-2">
                <SkeletonBlock className="h-4 w-36" />
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="h-4 w-44" />
              </div>

              <SkeletonBlock className="mt-4 h-10 w-full rounded-[10px]" />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
