"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderPlus, ReceiptText, WalletCards } from "lucide-react";
import { selectCeoActivity } from "../utils/ceoPortfolio";

export default function CeoGmeaActivity({ events }: { events: ReturnType<typeof selectCeoActivity> }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <aside className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_-25px_rgba(15,23,42,.2)]">
      <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-bold text-slate-950">Recent Activity</h2>
        {events.length > 5 && <button onClick={() => setExpanded(!expanded)} className="rounded text-[11px] font-semibold text-teal-700 hover:underline focus-visible:ring-2 focus-visible:ring-teal-700">{expanded ? "Show less" : "View all"}</button>}
      </div>
      <p className="mt-2 text-[10px] leading-4 text-slate-400">Project additions, payments, and dated expenses.</p>
      <div className="mt-5 space-y-5">
        {events.slice(0, expanded ? events.length : 5).map((event) => {
          const Icon = event.kind === "project" ? FolderPlus : event.kind === "payment" ? WalletCards : ReceiptText;
          return <Link key={event.id} href={`/gmea-projects/${event.projectId}`} className="flex gap-3 rounded-lg outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-700">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon size={16} /></span>
            <div className="min-w-0"><p className="line-clamp-2 text-xs font-semibold leading-4 text-slate-900">{event.title}</p><p className="mt-1 line-clamp-2 text-[10px] text-slate-500">{event.project}</p><time dateTime={event.date} className="mt-1 block text-[10px] text-slate-400">{new Date(event.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</time></div>
          </Link>;
        })}
        {!events.length && <p className="text-xs text-slate-400">No activity recorded yet.</p>}
      </div>
    </aside>
  );
}
