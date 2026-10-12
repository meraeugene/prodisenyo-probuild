import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonHeading, SkeletonStats, SkeletonListPanel } from "@/components/PageSkeletonParts";
import WorkspaceFiltersSkeleton from "@/components/workspace/WorkspaceFiltersSkeleton";
import EngineerProjectCardsSkeleton from "./EngineerProjectCardsSkeleton";
import styles from "@/components/workspace/workspace.module.css";
export default function EngineerDashboardSkeleton() {
  return <div role="status" aria-busy="true" aria-label="Loading engineer dashboard" className={styles.page}><div className="space-y-5">
    <CeoPageHeroSkeleton action="none" />
    <SkeletonStats helper count={5} className="grid grid-cols-2 gap-4 xl:grid-cols-5" />
    <section data-skeleton-panel="true" className="skeleton-surface overflow-hidden"><div className="border-b border-slate-100 p-4"><SkeletonHeading /></div><WorkspaceFiltersSkeleton tabs={0} filterCount={2} /><div className="p-4"><EngineerProjectCardsSkeleton /></div></section>
    <div className="grid gap-5 lg:grid-cols-2"><SkeletonListPanel /><SkeletonListPanel rows={3} /></div>
  </div></div>;
}
