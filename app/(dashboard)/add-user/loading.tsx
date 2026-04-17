function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-apple-mist/80 ${className}`}
    />
  );
}

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <section className="rounded-[16px] bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] p-6 shadow-[0_18px_36px_rgba(22,101,52,0.18)]">
        <SkeletonBlock className="h-3 w-20 bg-white/20" />
        <SkeletonBlock className="mt-4 h-10 w-72 max-w-full bg-white/20" />
        <SkeletonBlock className="mt-3 h-4 w-[30rem] max-w-full bg-white/15" />
      </section>

      <section className="grid gap-4 2xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-[22px] border border-apple-mist bg-white p-6 shadow-[0_10px_30px_rgba(24,83,43,0.06)]">
          <SkeletonBlock className="h-6 w-40" />
          <div className="mt-5 space-y-4">
            <SkeletonBlock className="h-10 w-full rounded-xl" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
            <SkeletonBlock className="h-10 w-32 rounded-xl" />
          </div>
        </div>

        <div className="rounded-[22px] border border-apple-mist bg-white p-6 shadow-[0_10px_30px_rgba(24,83,43,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <SkeletonBlock className="h-6 w-44" />
            <SkeletonBlock className="h-9 w-28 rounded-full" />
          </div>
          <div className="mt-5 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[1.4fr_1fr_1fr_auto] items-center gap-3 rounded-2xl border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 py-4"
              >
                <SkeletonBlock className="h-4 w-36 rounded-full" />
                <SkeletonBlock className="h-4 w-24 rounded-full" />
                <SkeletonBlock className="h-4 w-20 rounded-full" />
                <SkeletonBlock className="h-9 w-9 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
