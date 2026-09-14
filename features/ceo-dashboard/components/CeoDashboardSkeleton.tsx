import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";
import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";

function MetricStripSkeleton() {
  return (
    <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className={`min-h-[116px] px-5 py-4 ${index ? "border-t border-slate-100 sm:border-l xl:border-t-0" : ""}`}>
          <Block className="h-3 w-24" />
          <Block className="mt-2 h-7 w-20" />
          <div className="mt-3 flex justify-between gap-3"><Block className="h-3 w-20" /><Block className="h-7 w-16" /></div>
        </div>
      ))}
    </div>
  );
}

export default function CeoDashboardSkeleton() {
  return (
    <main role="status" aria-label="Loading dashboard" className="min-h-full bg-slate-50/40 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <CeoPageHeroSkeleton />
      <div className="mt-4 space-y-4">
        <MetricStripSkeleton />
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,.95fr)]">
          <SkeletonPanel className="h-[390px] rounded-xl p-5"><Block className="h-5 w-44" /><Block className="mt-5 h-64 w-full" /><Block className="mt-4 h-16 w-full" /></SkeletonPanel>
          <SkeletonPanel className="h-[390px] rounded-xl p-5"><Block className="h-5 w-36" /><div className="mt-5 space-y-5">{Array.from({ length: 5 }, (_, index) => <Block key={index} className="h-8 w-full" />)}</div></SkeletonPanel>
        </div>
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,.65fr)]">
          <SkeletonPanel className="h-[330px] rounded-xl p-5"><Block className="h-5 w-40" /><div className="mt-6 space-y-5">{Array.from({ length: 4 }, (_, index) => <Block key={index} className="h-11 w-full" />)}</div></SkeletonPanel>
          <SkeletonPanel className="h-[330px] rounded-xl p-5"><Block className="h-5 w-48" /><div className="mt-6 space-y-5">{Array.from({ length: 4 }, (_, index) => <Block key={index} className="h-10 w-full" />)}</div></SkeletonPanel>
        </div>
      </div>
    </main>
  );
}
