import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CeoProgressUpdate } from "@/features/ceo-dashboard/types";
import { formatCeoDate } from "@/features/ceo-dashboard/utils/ceoDashboard";

export default function CeoRecentProgressPanel({ updates }: { updates: CeoProgressUpdate[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-bold tracking-tight text-slate-950">Recent Progress Updates</h2>
        <Link href="/projects" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900">
          View all <ArrowRight size={13} />
        </Link>
      </div>
      <div className="relative px-5 py-2 before:absolute before:bottom-6 before:left-[25px] before:top-6 before:w-px before:bg-slate-200">
        {updates.slice(0, 5).map((update, index) => (
          <Link key={update.id} href={`/projects/${update.projectId}`} className="relative grid grid-cols-[20px_minmax(0,1fr)_auto] gap-3 border-b border-slate-100 py-3 last:border-0 hover:bg-slate-50/60">
            <span className={`relative z-10 mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${index % 3 === 2 ? "bg-blue-600" : "bg-emerald-600"}`} />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900">{update.summary}</p>
              <p className="mt-1 truncate text-[11px] text-slate-500">{update.projectName} · {update.engineer}</p>
            </div>
            <time className="shrink-0 text-[10px] text-slate-400">{formatCeoDate(update.createdAt)}</time>
          </Link>
        ))}
        {!updates.length ? <p className="py-10 text-center text-sm text-slate-500">No progress updates yet.</p> : null}
      </div>
    </section>
  );
}
