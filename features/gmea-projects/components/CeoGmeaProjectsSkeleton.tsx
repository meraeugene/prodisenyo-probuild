import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonStats, SkeletonTable } from "@/components/PageSkeletonParts";
import { SkeletonPanel, SkeletonBlock as Block } from "@/components/LoadingSkeleton";

export default function CeoGmeaProjectsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading GMEA project portfolio" className="min-h-screen bg-white/40 p-4 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <CeoPageHeroSkeleton action="none" />
        <SkeletonStats count={4} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" />
        <section className="grid gap-3 xl:grid-cols-[1.35fr_.85fr]">
          <SkeletonPanel><Block className="h-6 w-64" /><Block className="mt-3 h-4 w-56" /><Block className="mt-4 h-[300px] w-full" /></SkeletonPanel>
          <SkeletonPanel><Block className="h-6 w-40" /><Block className="mx-auto mt-5 h-40 w-40 rounded-full" /></SkeletonPanel>
        </section>
        <SkeletonPanel className="overflow-hidden p-0">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-3">
            {Array.from({ length: 6 }, (_, index) => <Block key={index} className="h-10 w-28" />)}
          </div>
          <div className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_200px_190px]">
            {[0, 1, 2].map((index) => <Block key={index} className="h-11 w-full rounded-xl" />)}
          </div>
          <SkeletonTable columns={9} rows={5} />
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
            <Block className="h-5 w-48" />
            <div className="flex gap-1.5">{[0, 1, 2, 3, 4].map((index) => <Block key={index} className="h-9 w-9 rounded-lg" />)}</div>
          </div>
        </SkeletonPanel>
      </div>
    </div>
  );
}
