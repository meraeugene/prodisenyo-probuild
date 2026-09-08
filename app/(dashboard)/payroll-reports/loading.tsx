import PayrollReportsArchiveSkeleton from "@/features/payroll-reports/components/PayrollReportsArchiveSkeleton";

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[linear-gradient(90deg,rgba(230,250,247,0.95),rgba(240,253,250,1),rgba(230,250,247,0.95))] bg-[length:200%_100%] ${className}`}
    />
  );
}

export default function Loading() {
  return (
    <div className="space-y-4 overflow-x-hidden p-0 sm:p-6">
      <section className="rounded-none bg-[linear-gradient(135deg,#063b38,#075f5b,#087a75)] p-5 shadow-[0_18px_36px_rgba(7,109,105,0.18)] sm:rounded-[14px] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-24 bg-white/20" />
            <SkeletonBlock className="h-10 w-80 max-w-full bg-white/20" />
            <SkeletonBlock className="h-4 w-full max-w-[36rem] bg-white/15" />
          </div>
        </div>
      </section>

      <PayrollReportsArchiveSkeleton />
    </div>
  );
}
