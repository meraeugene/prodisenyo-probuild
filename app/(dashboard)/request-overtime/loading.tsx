function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[linear-gradient(90deg,rgba(232,242,236,0.95),rgba(244,249,246,1),rgba(232,242,236,0.95))] bg-[length:200%_100%] ${className}`}
    />
  );
}

export default function Loading() {
  return (
    <div className="p-0 sm:p-6 xl:flex xl:h-screen xl:flex-col xl:overflow-hidden">
      <section className="rounded-none bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] p-5 shadow-[0_18px_36px_rgba(22,101,52,0.18)] sm:rounded-[14px] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-24 bg-white/20" />
            <SkeletonBlock className="h-10 w-80 max-w-full bg-white/20" />
            <SkeletonBlock className="h-4 w-[40rem] max-w-full bg-white/15" />
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 overflow-x-hidden xl:min-h-0 xl:flex-1 xl:grid-cols-[1.08fr_0.92fr] xl:items-stretch">
        <section className="rounded-[16px] border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
          <SkeletonBlock className="h-6 w-56" />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonBlock
                key={`request-overtime-field-${index}`}
                className="h-10 w-full"
              />
            ))}
            <SkeletonBlock className="h-20 w-full md:col-span-2" />
            <div className="md:col-span-2 flex justify-end">
              <SkeletonBlock className="h-10 w-36" />
            </div>
          </div>
        </section>

        <section className="rounded-[16px] border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)] xl:flex xl:h-full xl:min-h-0 xl:flex-col">
          <div className="mb-4 flex items-center justify-between gap-3">
            <SkeletonBlock className="h-6 w-56" />
            <SkeletonBlock className="h-6 w-24 rounded-full" />
          </div>

          <div className="max-h-[30rem] space-y-3 overflow-hidden pr-1 xl:min-h-0 xl:flex-1 xl:max-h-none">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`request-overtime-card-${index}`}
                className="overflow-hidden rounded-2xl border border-apple-mist bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.07)]"
              >
                <SkeletonBlock className="h-3 w-28" />
                <SkeletonBlock className="mt-3 h-6 w-44" />
                <SkeletonBlock className="mt-3 h-4 w-24" />
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <SkeletonBlock className="h-12 w-full rounded-xl" />
                  <SkeletonBlock className="h-12 w-full rounded-xl" />
                  <SkeletonBlock className="h-12 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
