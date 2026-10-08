import { SkeletonBlock } from "@/components/LoadingSkeleton";
import WorkspaceTableSkeleton from "@/components/workspace/WorkspaceTableSkeleton";

export default function GeneratePayrollRecordsSkeleton() {
  return <div data-workspace-list-skeleton="true" className="min-w-0 p-4 sm:p-5">
    <div className="flex flex-wrap gap-2 pb-4">{["w-36", "w-32", "w-20", "w-32"].map((width, index) => <SkeletonBlock key={index} className={`h-9 ${width}`} />)}</div>
    <div className="flex flex-col gap-3 pb-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
      <div className="grid flex-1 gap-3 md:grid-cols-2 2xl:max-w-[760px] 2xl:grid-cols-[minmax(220px,1fr)_170px_190px]">
        <SkeletonBlock className="h-9 w-full" /><SkeletonBlock className="h-9 w-full" /><SkeletonBlock className="h-9 w-full" />
      </div>
      <div className="flex flex-wrap gap-2"><SkeletonBlock className="h-9 w-20" /><SkeletonBlock className="h-9 w-32" /><SkeletonBlock className="h-9 w-24" /><SkeletonBlock className="h-9 w-28" /></div>
    </div>
    <WorkspaceTableSkeleton columns={8} minWidth={0} rowHeight={57} firstColumnLines={2} mobileCards mobileBreakpoint="xl" columnWidths={["23%", "18%", "10%", "10%", "10%", "10%", "10%", "64px"]} />
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3"><SkeletonBlock className="h-4 w-44" /><SkeletonBlock className="h-9 w-60" /></div>
  </div>;
}
