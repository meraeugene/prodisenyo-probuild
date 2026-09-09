import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";

export default function CostTrackingSkeleton() {
  return <div role="status" aria-label="Loading cost tracking" className="space-y-5">
    <Block className="h-7 w-36" />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(15rem,1.25fr)_minmax(12rem,0.8fr)_minmax(12rem,0.8fr)]">{[0,1,2].map(i => <Block key={i} className="h-11 w-full rounded-xl" />)}</div>
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="grid gap-4 xl:grid-cols-3">{[0,1,2].map(i => <SkeletonPanel key={i} className="min-h-[28rem] p-4"><div className="flex justify-between gap-3"><div><Block className="h-6 w-28" /><Block className="mt-1 h-4 w-12" /></div><Block className="h-5 w-20" /></div><div className="mt-4 space-y-3">{[0,1].map(j => <div key={j} className="rounded-xl border border-slate-200 p-4"><Block className="h-5 w-32" /><Block className="mt-1 h-4 w-20" /><Block className="mt-4 h-6 w-28" /><Block className="mt-3 h-4 w-36" /></div>)}</div></SkeletonPanel>)}</div>
      <aside><SkeletonPanel><Block className="h-6 w-28" /><div className="mt-4 divide-y divide-slate-100">{[0,1,2,3].map(i => <div key={i} className="flex justify-between gap-4 py-3"><Block className="h-5 w-28" /><Block className="h-5 w-20" /></div>)}</div><div className="mt-3 border-t border-slate-200 pt-3">{[0,1,2].map(i => <div key={i} className="flex justify-between gap-4 py-2.5"><Block className="h-5 w-32" /><Block className="h-5 w-8" /></div>)}</div></SkeletonPanel></aside>
    </div>
  </div>;
}
