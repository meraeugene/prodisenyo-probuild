import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";
import { SkeletonStats, SkeletonHeading, SkeletonListPanel } from "@/components/PageSkeletonParts";
import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
export default function GmeaOverviewSkeleton() {
 return <main role="status" aria-busy="true" aria-label="Loading GMEA overview" className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8"><div className="mx-auto max-w-[1440px] space-y-4">
  <CeoPageHeroSkeleton action="none" titleWidth="w-64" />
  <SkeletonStats count={7} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" />
  <section><SkeletonHeading /><div className="mt-4 grid gap-4 xl:grid-cols-2">{[0,1].map(index=><SkeletonPanel key={index}><Block className="h-6 w-44" /><Block className="mt-2 h-3 w-48" /><div className="mt-5 grid grid-cols-3 gap-3 pt-4">{[0,1,2].map(i=><div key={i}><Block className="h-3 w-20" /><Block className="mt-2 h-6 w-24" /></div>)}</div></SkeletonPanel>)}</div></section>
  <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">{[0,1].map(i=><SkeletonPanel key={i} className="rounded-[20px] p-5 sm:p-6"><SkeletonHeading /><Block className="mt-5 h-6 w-48" /><Block className="mt-4 h-[280px] w-full rounded-xl sm:h-[300px]" /><div className="mt-5 grid gap-3 sm:grid-cols-2"><Block className="h-24 w-full rounded-2xl" /><Block className="h-24 w-full rounded-2xl" /></div></SkeletonPanel>)}</section>
  <section className="grid gap-4 xl:grid-cols-2"><SkeletonListPanel /><SkeletonListPanel rows={3} /></section>
 </div></main>;
}
