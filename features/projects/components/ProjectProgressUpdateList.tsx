"use client";

import { useState } from "react";
import {
  ClipboardList,
  Eye,
  MoreVertical,
  Trash2,
} from "lucide-react";
import type { ProjectProgressUpdateRecord } from "../progressUpdateTypes";
import {
  formatProgressDateParts,
  formatProgressPercentage,
} from "../utils/progressUpdatePresentation";

export default function ProjectProgressUpdateList({
  updates,
  className,
  canManage = false,
  onView,
  onDelete,
}: {
  updates: ProjectProgressUpdateRecord[];
  className?: string;
  canManage?: boolean;
  onView?: (update: ProjectProgressUpdateRecord) => void;
  onDelete?: (update: ProjectProgressUpdateRecord) => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <section
      className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_22px_rgba(15,23,42,.04)] ${className ?? ""}`}
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
              Daily Progress Updates
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Completed work and site remarks, newest first.
            </p>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {updates.length} {updates.length === 1 ? "update" : "updates"}
        </span>
      </div>

      <div className="space-y-3 p-3 sm:p-4 xl:max-h-[calc(100vh-22rem)] xl:min-h-[340px] xl:overflow-y-auto">
        {updates.map((update) => {
          const progressDate = formatProgressDateParts(
            update.progress_date ?? update.created_at,
          );
          const submittedDate = formatProgressDateParts(update.created_at);
          const menuOpen = openMenuId === update.id;

          return (
            <article
              key={update.id}
              className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 sm:grid-cols-[72px_minmax(0,1fr)_120px] sm:items-start sm:p-5"
            >
              <time
                dateTime={update.progress_date ?? update.created_at}
                className="flex w-full items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-slate-600 sm:block sm:px-2 sm:py-3 sm:text-center"
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  {progressDate.month}
                </span>
                <span className="text-lg font-bold leading-none text-slate-950 sm:mt-1 sm:block sm:text-2xl">
                  {progressDate.day}
                </span>
                <span className="text-[11px] text-slate-500 sm:mt-1 sm:block">
                  {progressDate.year}
                </span>
              </time>

              <div className="min-w-0">
                <p className="whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-900">
                  {update.completed_work_summary}
                </p>
                {update.remarks ? (
                  <div className="mt-2 flex items-start gap-2 text-sm leading-5 text-slate-500">
                    <ClipboardList size={15} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                    <p className="whitespace-pre-wrap">{update.remarks}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">No remarks added</p>
                )}
                <time dateTime={update.created_at} className="mt-3 block text-xs text-slate-400">
                  Submitted {submittedDate.time}
                </time>
              </div>

              <div className="flex items-start justify-between gap-2 sm:justify-end">
                <div className="text-left sm:text-right">
                  <span className="text-xs font-medium text-slate-500">Overall</span>
                  <strong className="mt-1 block text-xl font-bold tracking-tight text-teal-800 tabular-nums">
                    {formatProgressPercentage(update.overall_percent)}
                  </strong>
                </div>

                {canManage && onView && onDelete ? (
                  <div
                    className="relative"
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) {
                        setOpenMenuId(null);
                      }
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenMenuId(menuOpen ? null : update.id)}
                      aria-label="Progress update actions"
                      aria-expanded={menuOpen}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                    >
                      <MoreVertical size={18} aria-hidden="true" />
                    </button>
                    {menuOpen ? (
                      <div className="absolute right-0 top-10 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onView(update);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <Eye size={15} aria-hidden="true" />
                          View details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onDelete(update);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}

        {updates.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-5 py-12 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <ClipboardList size={20} aria-hidden="true" />
            </span>
            <p className="mt-4 font-semibold text-slate-800">No progress updates yet</p>
            <p className="mt-1 max-w-xs text-sm leading-5 text-slate-500">
              Engineer-submitted daily updates will appear here.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
