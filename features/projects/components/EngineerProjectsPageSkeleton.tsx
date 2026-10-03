import ProjectsLoadingHeader from "./ProjectsLoadingHeader";
import styles from "./projects.module.css";
import { SkeletonStats, SkeletonToolbar, SkeletonTable } from "@/components/PageSkeletonParts";
export default function EngineerProjectsPageSkeleton() {return <div role="status" aria-busy="true" aria-label="Loading assigned projects" className={`${styles.page} space-y-6`}><ProjectsLoadingHeader /><SkeletonStats helper count={4} cardClassName="rounded-2xl p-4" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" /><section className={styles.panel}><div className="border-b border-slate-200 p-4"><SkeletonToolbar /></div><SkeletonTable columns={6} rows={5} /></section></div>;}
