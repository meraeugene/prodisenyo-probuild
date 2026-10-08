import ProjectsLoadingHeader from "./ProjectsLoadingHeader";
import { SkeletonStats } from "@/components/PageSkeletonParts";
import { SkeletonBlock } from "@/components/LoadingSkeleton";
import WorkspaceTableSkeleton from "@/components/workspace/WorkspaceTableSkeleton";

export default function EngineerProjectsPageSkeleton() {
  return <div role="status" aria-busy="true" aria-label="Loading assigned projects" className="min-h-full space-y-6 px-4 pb-8 pt-5 sm:px-6 sm:pb-9 sm:pt-6 xl:px-7">
    <ProjectsLoadingHeader /><SkeletonStats helper count={4} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" />
    <div className="min-w-0">
      <div className="grid gap-3 p-4 lg:grid-cols-[minmax(240px,1fr)_180px_220px]"><SkeletonBlock className="h-10 w-full" /><SkeletonBlock className="h-10 w-full" /><SkeletonBlock className="h-10 w-full" /></div>
      <WorkspaceTableSkeleton columns={6} rows={5} minWidth={980} rowHeight={72} firstColumnLines={2} mobileCards mobileBreakpoint="lg" />
      <div className="px-4 py-3"><SkeletonBlock className="h-4 w-48" /></div>
    </div>
  </div>;
}
