import { SkeletonBlock as Block, SkeletonPanel, SkeletonRows } from "@/components/LoadingSkeleton";

export default function ProjectContentSkeleton({ tab }: { tab: "materials" | "documents" | "activity-log" }) {
  if (tab === "materials") {
    return <div role="status" aria-label="Loading materials" className="space-y-4">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 sm:flex-row sm:items-center"><div className="flex gap-1.5 overflow-hidden">{[0,1,2,3].map(i => <Block key={i} className="h-9 w-28 shrink-0 rounded-xl" />)}</div><Block className="h-9 w-full sm:w-64" /></div>
      {[0,1,2].map(i => <SkeletonPanel key={i} className="flex flex-col justify-between gap-6 md:flex-row md:items-center"><div className="flex min-w-0 flex-1 items-start gap-4"><Block className="h-16 w-16 shrink-0 rounded-xl" /><div className="min-w-0 flex-1 space-y-2"><Block className="h-5 w-48" /><Block className="h-6 w-56" /><Block className="h-5 w-32" /><Block className="h-4 w-80" /></div></div><div className="flex gap-2 self-end md:self-center"><Block className="h-10 w-24 rounded-xl" /><Block className="h-10 w-24 rounded-xl" /></div></SkeletonPanel>)}
    </div>;
  }
  const body = <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"><SkeletonPanel><Block className="h-7 w-44" /><div className="mt-5 flex flex-wrap gap-3"><Block className="h-10 w-56" /><Block className="h-10 w-40" />{tab === "activity-log" && <><Block className="h-10 w-36" /><Block className="h-10 w-36" /></>}</div><SkeletonRows rows={5} /></SkeletonPanel><SkeletonPanel className="h-fit"><Block className="h-6 w-36" /><SkeletonRows rows={3} /></SkeletonPanel></div>;
  return <div role="status" aria-label={`Loading ${tab}`}>{tab === "documents" ? <SkeletonPanel className="p-4 sm:p-5"><div className="mb-5 flex justify-between gap-3"><div><Block className="h-7 w-48" /><Block className="mt-1 h-5 w-64" /></div><Block className="h-10 w-28" /></div>{body}</SkeletonPanel> : body}</div>;
}
