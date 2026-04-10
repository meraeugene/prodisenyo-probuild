"use client";

import { Clock3 } from "lucide-react";

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[#dff0e6] ${className}`}
    />
  );
}

export default function PayrollReportsArchiveSkeleton() {
  return (
    <section className="mt-4 rounded-[16px] border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
            Report Archive
          </p>
          <h2 className="mt-2 text-xl font-semibold text-apple-charcoal">
            Pending And Approved Payroll Reports
          </h2>
          <p className="mt-2 text-sm text-apple-steel">
            Review submitted payroll reports before they move forward.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          <Clock3 size={12} />
          0 pending
        </span>
      </div>

      <div
        className="mt-4 overflow-hidden rounded-[20px] border border-apple-mist bg-white"
        aria-hidden="true"
      >
        <div className="grid grid-cols-[1.5fr_1fr_1.2fr_1.2fr_0.9fr_0.8fr_1fr] gap-3 border-b border-apple-mist bg-[rgb(var(--apple-snow))] px-3 py-2">
          <SkeletonBlock className="h-3 w-20 rounded-full" />
          <SkeletonBlock className="h-3 w-16 rounded-full" />
          <SkeletonBlock className="h-3 w-20 rounded-full" />
          <SkeletonBlock className="h-3 w-24 rounded-full" />
          <SkeletonBlock className="ml-auto h-3 w-14 rounded-full" />
          <SkeletonBlock className="mx-auto h-3 w-16 rounded-full" />
          <SkeletonBlock className="mx-auto h-3 w-16 rounded-full" />
        </div>

        <div className="divide-y divide-apple-mist">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`payroll-report-row-skeleton-${index}`}
              className="grid grid-cols-[1.5fr_1fr_1.2fr_1.2fr_0.9fr_0.8fr_1fr] items-center gap-3 px-3 py-4"
            >
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-32 rounded-full" />
                <SkeletonBlock className="h-3 w-24 rounded-full" />
              </div>
              <SkeletonBlock className="h-4 w-20 rounded-full" />
              <SkeletonBlock className="h-4 w-28 rounded-full" />
              <SkeletonBlock className="h-4 w-32 rounded-full" />
              <SkeletonBlock className="ml-auto h-4 w-24 rounded-full" />
              <div className="flex justify-center">
                <SkeletonBlock className="h-4 w-24 rounded-full" />
              </div>
              <div className="flex justify-center">
                <div className="rounded-xl border border-[#d9ece0] bg-[#f8fcf9] p-2">
                  <SkeletonBlock className="h-4 w-4 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
