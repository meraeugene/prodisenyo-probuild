import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";
import { SkeletonStats, SkeletonHeading } from "@/components/PageSkeletonParts";
import WorkspaceTableSkeleton from "@/components/workspace/WorkspaceTableSkeleton";

export default function GmeaProjectWorkspaceSkeleton() {
  return <div aria-busy="true" role="status" aria-label="Loading GMEA project" className="min-h-full space-y-5 p-4 sm:p-6 lg:p-8">
    <Block className="h-5 w-32" />
    <header className="workspace-page-header flex flex-wrap items-start justify-between gap-5 pb-2">
      <div className="min-w-0 basis-72 flex-1"><Block className="h-6 w-20" /><Block className="mt-2 h-8 w-40" /><Block className="mt-2.5 h-[33px] w-80" /><Block className="mt-4 h-5 w-52" /><Block className="mt-2 h-5 w-40" /></div>
      <div className="flex flex-wrap gap-2"><Block className="h-9 w-32" /><Block className="h-9 w-36" /><Block className="h-9 w-9" /></div>
    </header>
    <SkeletonStats helper count={4} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" />
    <div className="flex max-w-full flex-wrap gap-2">{["w-40", "w-24", "w-48"].map(width => <Block key={width} className={`h-9 ${width}`} />)}</div>
    <SkeletonPanel className="space-y-5 p-5 sm:p-7">
      <div className="flex flex-wrap justify-between gap-3"><SkeletonHeading /><Block className="h-9 w-44" /></div>
      <SkeletonStats compact helper count={3} className="grid gap-3 sm:grid-cols-3" />
      <WorkspaceTableSkeleton columns={8} rows={3} minWidth={900} rowHeight={64} />
      <div className="flex justify-between px-4 py-3"><Block className="h-5 w-24" /><Block className="h-5 w-36" /></div>
    </SkeletonPanel>
  </div>;
}
