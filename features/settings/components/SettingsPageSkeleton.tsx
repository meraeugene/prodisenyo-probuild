function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[linear-gradient(90deg,rgba(232,242,236,0.95),rgba(244,249,246,1),rgba(232,242,236,0.95))] bg-[length:200%_100%] ${className}`}
    />
  );
}

export default function SettingsPageSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <section className="rounded-[16px] bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] p-6 shadow-[0_18px_36px_rgba(22,101,52,0.18)]">
        <SkeletonBlock className="h-3 w-24 bg-white/20" />
        <SkeletonBlock className="mt-4 h-10 w-56 max-w-full bg-white/20" />
        <SkeletonBlock className="mt-3 h-4 w-[30rem] max-w-full bg-white/15" />
      </section>

      <section className="grid items-stretch gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="rounded-[18px] border border-[#e7ecef] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="space-y-2">
            <SkeletonBlock className="h-6 w-32" />
            <SkeletonBlock className="h-4 w-64" />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
            <div className="flex flex-col items-center rounded-[18px] border border-[#edf2f4] bg-[#f8fbfc] px-5 py-6">
              <SkeletonBlock className="h-28 w-28 rounded-full" />
              <SkeletonBlock className="mt-4 h-10 w-36 rounded-xl" />
              <SkeletonBlock className="mt-3 h-4 w-28" />
            </div>

            <div className="grid min-w-0 gap-4">
              <SkeletonBlock className="h-12 w-full rounded-[14px]" />
              <div className="grid gap-4 md:grid-cols-2">
                <SkeletonBlock className="h-12 w-full rounded-[14px]" />
                <SkeletonBlock className="h-12 w-full rounded-[14px]" />
              </div>
              <SkeletonBlock className="h-12 w-full rounded-[14px]" />
              <SkeletonBlock className="h-11 w-36 rounded-[12px]" />
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-[#e7ecef] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="space-y-2">
            <SkeletonBlock className="h-6 w-36" />
            <SkeletonBlock className="h-4 w-60" />
          </div>
          <div className="mt-5 space-y-4">
            <SkeletonBlock className="h-12 w-full rounded-[14px]" />
            <SkeletonBlock className="h-12 w-full rounded-[14px]" />
            <SkeletonBlock className="h-4 w-64" />
            <SkeletonBlock className="h-11 w-40 rounded-[12px]" />
          </div>
        </div>
      </section>
    </div>
  );
}
