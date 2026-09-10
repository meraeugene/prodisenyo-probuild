import { CalendarClock, Plus, X } from "lucide-react";
import type { ProjectProgressUpdateRecord } from "../progressUpdateTypes";
import { selectLatestProgressUpdate } from "../utils/progressUpdates";
import {
  clampProgressPercentage,
  formatProgressDate,
  formatProgressPercentage,
} from "../utils/progressUpdatePresentation";

export default function ProjectProgressSummary({
  updates,
  canSubmit,
  isFormOpen,
  onToggleForm,
}: {
  updates: ProjectProgressUpdateRecord[];
  canSubmit: boolean;
  isFormOpen: boolean;
  onToggleForm: () => void;
}) {
  const latestUpdate = selectLatestProgressUpdate(updates);
  const currentPercent = latestUpdate?.overall_percent ?? 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_22px_rgba(15,23,42,.04)]">
      <div className="bg-[#075e5b] px-5 py-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-100">
          Overall project progress
        </p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <strong className="text-4xl font-bold tracking-tight tabular-nums">
            {latestUpdate ? formatProgressPercentage(currentPercent) : "—"}
          </strong>
          <span className="pb-1 text-xs font-medium text-teal-100">
            Engineer entered
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-teal-200 transition-[width]"
            style={{ width: `${clampProgressPercentage(currentPercent)}%` }}
          />
        </div>
        <p className="mt-3 text-xs leading-5 text-teal-50/80">
          {latestUpdate
            ? `Progress dated ${formatProgressDate(latestUpdate.progress_date ?? latestUpdate.created_at)}`
            : "No overall percentage has been submitted yet."}
        </p>
      </div>

      {canSubmit ? (
        <div className="border-b border-slate-100 p-4">
          <button
            type="button"
            onClick={onToggleForm}
            aria-expanded={isFormOpen}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          >
            {isFormOpen ? <X size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}
            {isFormOpen ? "Close update form" : "Add progress update"}
          </button>
        </div>
      ) : null}

      <div className="p-5">
        <div className="flex items-center gap-2">
          <CalendarClock size={16} className="text-teal-700" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-slate-900">Progress history</h3>
        </div>
        <div className="mt-3 divide-y divide-slate-100">
          {updates.slice(0, 5).map((update, index) => (
            <div key={update.id} className="flex items-center justify-between gap-4 py-2.5">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-700">
                  {formatProgressDate(update.progress_date ?? update.created_at)}
                </p>
                {index === 0 ? (
                  <p className="mt-0.5 text-[11px] font-medium text-teal-700">Current</p>
                ) : null}
              </div>
              <strong className="shrink-0 text-sm text-slate-900 tabular-nums">
                {formatProgressPercentage(update.overall_percent)}
              </strong>
            </div>
          ))}
          {updates.length === 0 ? (
            <p className="py-5 text-center text-xs leading-5 text-slate-500">
              Percentage history will appear after the first update.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
