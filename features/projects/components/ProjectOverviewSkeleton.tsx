import { SkeletonBlock as Block, SkeletonPanel, SkeletonRows } from "@/components/LoadingSkeleton";

function InfoRows({ count, gap = "gap-4" }: { count: number; gap?: string }) {
  return <div className={`grid ${gap}`}>{Array.from({length: count}, (_, i) => <div key={i} className="flex justify-between gap-4"><Block className="h-5 w-28" /><Block className="h-5 w-32" /></div>)}</div>;
}

export default function ProjectOverviewSkeleton() {
  return <div className="space-y-4">
    <div className="grid gap-4 xl:grid-cols-3">{[0,1,2].map(i => <SkeletonPanel key={i}><div className="mb-6 flex items-center justify-between"><Block className="h-6 w-36" /><Block className="h-9 w-9" /></div>{i === 0 ? <><div className="flex items-end gap-3"><Block className="h-9 w-24" /><Block className="h-4 w-36" /></div><Block className="mt-5 h-2 w-full" /><div className="mt-5"><InfoRows count={3} gap="gap-3" /></div></> : i === 1 ? <><InfoRows count={2} /><div className="mt-4 border-t border-slate-100 pt-4"><InfoRows count={1} /></div></> : <InfoRows count={4} />}</SkeletonPanel>)}</div>
    <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">{[0,1].map(i => <SkeletonPanel key={i}><Block className="h-6 w-44" /><SkeletonRows rows={4} /></SkeletonPanel>)}</div>
  </div>;
}
