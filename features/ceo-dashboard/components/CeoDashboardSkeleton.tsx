import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
import styles from "./ceoDashboard.module.css";

export default function CeoDashboardSkeleton() {
  return (
    <main aria-busy="true" role="status" aria-label="Loading dashboard" className={styles.page}>
      <div className={styles.topbar}><Block className="h-3 w-44" /><Block className="h-3 w-28" /></div>
      <div className="flex flex-wrap items-start justify-between gap-4"><div><Block className="h-9 w-64" /><Block className="mt-2 h-4 w-72 max-w-full" /></div><Block className="h-10 w-36 rounded-[10px]" /></div>
      <div className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className={`${styles.panel} px-5 py-5`}><Block className="h-7 w-24" /><Block className="mt-2 h-4 w-28" /><Block className="mt-1.5 h-3 w-24" /></div>)}</div>
        <div className={styles.performanceGrid}>
          <div className={`${styles.panel} p-5`}><Block className="h-5 w-44" /><Block className="mt-5 h-64 w-full" /><Block className="mt-4 h-14 w-full" /></div>
          <div className={`${styles.panel} p-5`}><Block className="h-5 w-36" /><div className="mt-5 space-y-5">{Array.from({ length: 4 }, (_, index) => <Block key={index} className="h-12 w-full" />)}</div></div>
        </div>
        <div className={styles.portfolioGrid}>{[5, 3].map((rows, index) => <div key={index} className={`${styles.panel} p-5`}><Block className="h-5 w-40" /><div className="mt-5 space-y-4">{Array.from({ length: rows }, (_, row) => <Block key={row} className="h-9 w-full" />)}</div></div>)}</div>
      </div>
    </main>
  );
}
