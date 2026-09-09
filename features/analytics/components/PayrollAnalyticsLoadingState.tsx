function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`max-w-full animate-pulse rounded-2xl bg-slate-200/70 motion-reduce:animate-none ${className}`}
    />
  );
}

export function PayrollAnalyticsLoadingState() {
  return (
    <section role="status" aria-label="Loading payroll insights" className="overflow-hidden rounded-2xl border border-apple-mist bg-white shadow-sm">
      <div className="border-b border-apple-mist px-5 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
        <SkeletonBlock className="h-3 w-24 rounded-full" />
        <SkeletonBlock className="mt-1 h-7 w-80 sm:h-8" />
        <SkeletonBlock className="mt-1 h-5 w-[36rem]" />
      </div>

      <div className="space-y-10 px-5 py-6 sm:px-8 sm:py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_18px_rgba(7,109,105,0.06)] sm:p-5"
            >
              <SkeletonBlock className="h-3 w-24 rounded-full" />
              <SkeletonBlock className="mt-2 h-7 w-32 rounded-full" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3"><SkeletonBlock className="h-4 w-40" /><SkeletonBlock className="h-10 w-72" /></div>
          <div className="h-[360px] rounded-2xl border border-apple-mist bg-white p-4 sm:p-6"><div className="flex h-full items-end gap-4 border-b border-l border-slate-100 p-4">{[40,65,50,80,70,90].map((height, i) => <div key={i} className="flex-1 animate-pulse rounded-t-lg bg-slate-200/70 motion-reduce:animate-none" style={{ height: `${height}%` }} />)}</div></div>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <SkeletonBlock className="h-3 w-48 rounded-full" />
            <div className="min-h-[350px] rounded-2xl border border-apple-mist bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-6">
              <div className="grid h-full min-h-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="flex h-[220px] items-center justify-center sm:h-[240px] lg:h-full lg:min-h-[260px]">
                  <div className="flex h-48 w-48 items-center justify-center rounded-full bg-apple-snow">
                    <div className="h-28 w-28 rounded-full border-[18px] border-apple-mist bg-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-start gap-2 py-1">
                      <SkeletonBlock className="mt-1 h-2.5 w-2.5 rounded-full" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <SkeletonBlock className="h-3 w-20 rounded-full" />
                        <SkeletonBlock className="h-4 w-28 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <SkeletonBlock className="h-3 w-48 rounded-full" />
            <div className="h-[550px] rounded-2xl border border-apple-mist bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-6">
              <div className="grid h-full gap-4">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <SkeletonBlock className="h-4 w-24 rounded-full" />
                    <SkeletonBlock className="h-9 flex-1 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <SkeletonBlock className="h-3 w-40 rounded-full" />
              <SkeletonBlock className="h-3 w-36 rounded-full" />
            </div>
            <div className="h-[380px] rounded-2xl border border-apple-mist bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-6">
              <div className="flex h-full items-end gap-5">
                <SkeletonBlock className="h-[48%] flex-1 rounded-t-2xl rounded-b-md" />
                <SkeletonBlock className="h-[72%] flex-1 rounded-t-2xl rounded-b-md" />
                <SkeletonBlock className="h-[59%] flex-1 rounded-t-2xl rounded-b-md" />
                <SkeletonBlock className="h-[86%] flex-1 rounded-t-2xl rounded-b-md" />
                <SkeletonBlock className="h-[65%] flex-1 rounded-t-2xl rounded-b-md" />
                <SkeletonBlock className="h-[78%] flex-1 rounded-t-2xl rounded-b-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
