import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import WorkspaceTableSkeleton from "@/components/workspace/WorkspaceTableSkeleton";
import styles from "./ceoDashboard.module.css";

export default function CeoDashboardSkeleton() {
  return <main aria-busy="true" role="status" aria-label="Loading dashboard" className={styles.page}>
    <div className={styles.topbar}><Block className="h-4 w-64" /><Block className="h-4 w-32" /></div>
    <CeoPageHeroSkeleton variant="workspace" action="button" titleWidth="w-64" />
    <div className="mt-6 space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} data-skeleton-panel="true" className={`${styles.panel} px-5 py-5`}><Block className="h-4 w-28" /><Block className="mt-3 h-7 w-24" /><Block className="mt-1.5 h-5 w-32" /></div>)}</div>
      <div className={styles.performanceGrid}>
        <div data-skeleton-panel="true" className={styles.panel}><div className="flex flex-wrap justify-between gap-3 px-5 pb-2 pt-4"><div><Block className="h-6 w-44" /><Block className="mt-2 h-4 w-64" /></div><Block className="h-9 w-32" /></div><div className="h-64 px-2 pt-2"><Block className="h-full w-full" /></div><div className="grid gap-3 p-5 sm:grid-cols-3">{[0, 1, 2].map(index => <div key={index}><Block className="h-6 w-28" /><Block className="mt-1 h-4 w-24" /></div>)}</div></div>
        <div data-skeleton-panel="true" className={`${styles.panel} p-5`}><Block className="h-6 w-36" /><div className="mt-5"><WorkspaceTableSkeleton columns={4} rows={4} minWidth={0} rowHeight={72} /></div></div>
      </div>
      <div className={styles.portfolioGrid}>
        <div data-skeleton-panel="true" className={`${styles.panel} p-5`}><div className="flex flex-wrap items-center justify-between gap-3"><Block className="h-6 w-40" /><div className="flex flex-wrap gap-2">{["w-32", "w-28", "w-24"].map(width => <Block key={width} className={`h-9 ${width}`} />)}</div></div><div className="mt-3"><WorkspaceTableSkeleton columns={6} rows={5} minWidth={650} /></div></div>
        <div data-skeleton-panel="true" className={`${styles.panel} p-5`}><div className="flex flex-wrap items-center justify-between gap-2"><Block className="h-6 w-44" /><Block className="h-4 w-12" /></div><div className="mt-4">{[0, 1, 2].map(index => <div key={index} className="py-4 pl-5"><Block className="h-4 w-24" /><Block className="mt-1 h-5 w-full" /><Block className="mt-1 h-5 w-48" /></div>)}</div></div>
      </div>
    </div>
  </main>;
}
