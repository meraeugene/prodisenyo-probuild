import Link from "next/link";
import type { CeoProgressUpdate } from "../types";
import { formatCeoDate } from "../utils/ceoDashboard";
import styles from "./ceoDashboard.module.css";

export default function CeoRecentProgressPanel({ updates }: { updates: CeoProgressUpdate[] }) {
  return (
    <section className={`${styles.panel} p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={styles.heading}>Recent Progress Updates</h2>
        <Link href="/projects" className="text-[11px] font-medium text-[#076d69] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700">View all</Link>
      </div>
      <div className="relative mt-4 before:absolute before:bottom-8 before:left-[4px] before:top-5 before:w-px before:bg-teal-900/10">
        {updates.slice(0, 5).map((update) => (
          <Link key={update.id} href={`/projects/${update.projectId}`} className="relative flex gap-4 rounded-lg py-4 transition-colors hover:bg-teal-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700">
            <span aria-hidden="true" className="relative mt-1.5 h-[9px] w-[9px] shrink-0 rounded-full bg-[#076d69] ring-4 ring-white" />
            <div className="min-w-0">
              <time dateTime={update.createdAt} className="text-[11px] text-[#53736f]">{formatCeoDate(update.createdAt)}</time>
              <p className="mt-1 text-xs font-medium leading-5 text-[#1d1d1f]">{update.summary}</p>
              <p className="mt-1 text-[11px] leading-5 text-[#53736f]">{update.projectName} · {update.engineer}</p>
            </div>
          </Link>
        ))}
        {!updates.length && <p className="py-10 text-center text-sm text-[#53736f]">No progress updates yet.</p>}
      </div>
    </section>
  );
}
