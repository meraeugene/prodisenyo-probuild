"use client";

export default function PayrollApprovalQueueSkeleton() {
  return (
    <div
      className="mt-4 grid grid-cols-1 items-start gap-4"
      aria-hidden="true"
    >
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={`approval-skeleton-${index}`}
          className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_-25px_rgba(15,23,42,.25)]"
        >
          <div className="flex h-full flex-col animate-pulse">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-5 w-32 rounded-full bg-apple-mist" />
                <div className="h-6 w-28 rounded-full bg-apple-mist/80" />
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="h-4 w-28 rounded-full bg-apple-mist/80" />
                <div className="h-4 w-36 rounded-full bg-apple-mist/80" />
              </div>

              <div className="space-y-2">
                <div className="h-3 w-40 rounded-full bg-apple-mist/70" />
                <div className="h-10 w-full rounded-xl border border-apple-mist bg-white/80" />
              </div>

              <div className="space-y-2">
                <div className="h-8 w-36 rounded-lg border border-apple-mist bg-white/80" />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-apple-mist bg-white p-4 shadow-sm">
              <div className="space-y-2">
                <div className="h-3 w-20 rounded-full bg-apple-mist/70" />
                <div className="h-8 w-24 rounded-full bg-apple-mist" />
                <div className="h-3 w-16 rounded-full bg-apple-mist/80" />
              </div>
            </div>

            <div className="mt-auto flex items-end justify-between gap-4 pt-6">
              <div className="h-3 w-36 rounded-full bg-apple-mist/70" />
              <div className="flex gap-2">
                <div className="h-10 w-24 rounded-xl bg-apple-mist/80" />
                <div className="h-10 w-36 rounded-xl bg-apple-mist" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
