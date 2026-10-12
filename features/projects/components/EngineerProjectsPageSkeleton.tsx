import ProjectsLoadingHeader from "./ProjectsLoadingHeader";
import { SkeletonStats } from "@/components/PageSkeletonParts";
import { SkeletonBlock } from "@/components/LoadingSkeleton";
import WorkspaceTableSkeleton from "@/components/workspace/WorkspaceTableSkeleton";
import WorkspaceFiltersSkeleton from "@/components/workspace/WorkspaceFiltersSkeleton";
import styles from "@/components/workspace/workspace.module.css";

export default function EngineerProjectsPageSkeleton() {
  return <div role="status" aria-busy="true" aria-label="Loading assigned projects" className={`${styles.page} space-y-5`}>
    <ProjectsLoadingHeader /><SkeletonStats helper count={5} className="grid grid-cols-2 gap-4 xl:grid-cols-5" />
    <div data-skeleton-panel="true" className="skeleton-surface min-w-0 overflow-hidden">
      <WorkspaceFiltersSkeleton tabs={5} filterCount={1} />
      <WorkspaceTableSkeleton columns={6} rows={5} minWidth={980} rowHeight={72} firstColumnLines={2} mobileCards mobileBreakpoint="lg" />
      <div className="px-4 py-3"><SkeletonBlock className="h-4 w-48" /></div>
    </div>
  </div>;
}
