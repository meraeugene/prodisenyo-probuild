import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";
import { SkeletonStats, SkeletonHeading, SkeletonListPanel } from "@/components/PageSkeletonParts";
export default function GmeaOverviewSkeleton() {
 return <main role="status" aria-busy="true" aria-label="Loading GMEA overview" className="min-h-full bg-white px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8"><div className="mx-auto max-w-[1440px] space-y-4">
  <header className="rounded-[22px] bg-[#075e5b] px-6 py-7 sm:px-8 lg:px-9"><Block light className="h-3 w-48" /><Block light className="mt-2.5 h-10 w-96" /><Block light className="mt-3 h-4 w-full max-w-xl" /></header>
  <SkeletonStats count={5} className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-5" />
  <section><SkeletonHeading /><div className="mt-4 grid gap-4 xl:grid-cols-2">{[0,1].map(index=><SkeletonPanel key={index}><Block className="h-6 w-44" /><Block className="mt-2 h-3 w-48" /><div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">{[0,1,2].map(i=><div key={i}><Block className="h-3 w-20" /><Block className="mt-2 h-6 w-24" /></div>)}</div></SkeletonPanel>)}</div></section>
  <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,.7fr)]"><SkeletonPanel><SkeletonHeading /><div className="mt-5 space-y-5">{[0,1].map(i=><div key={i}><Block className="h-4 w-40" /><Block className="mt-3 h-5 w-full" /><Block className="mt-2 h-5 w-4/5" /></div>)}</div></SkeletonPanel><SkeletonPanel><SkeletonHeading /><Block className="mt-5 h-7 w-32" /><Block className="mt-4 h-24 w-full" /></SkeletonPanel></section>
  <section className="grid gap-4 xl:grid-cols-2"><SkeletonListPanel /><SkeletonListPanel rows={3} /></section>
 </div></main>;
}
