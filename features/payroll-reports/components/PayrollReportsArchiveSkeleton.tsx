import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
import WorkspaceTableSkeleton from "@/components/workspace/WorkspaceTableSkeleton";

export default function PayrollReportsArchiveSkeleton() {
  return <section role="status" aria-busy="true" aria-label="Loading payroll reports" data-skeleton-panel="true" className="skeleton-surface min-w-0 overflow-hidden">
    <div className="space-y-4 px-4 py-4">
      <div className="flex max-w-full flex-wrap gap-2">{["w-36", "w-32", "w-24", "w-24"].map((width, index) => <Block key={index} className={`h-9 ${width}`} />)}</div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(210px,1fr)_150px_150px_150px_120px]"><Block className="h-9 w-full" />{[0, 1, 2, 3].map(index => <Block key={index} className="h-9 w-full" />)}</div>
    </div>
    <WorkspaceTableSkeleton columns={10} minWidth={1100} />
    <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 px-4 py-3"><Block className="h-4 w-32" /><Block className="h-9 w-64" /></div>
  </section>;
}
