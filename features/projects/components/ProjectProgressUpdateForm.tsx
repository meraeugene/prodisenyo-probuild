"use client";

import { useState, useTransition } from "react";
import { ClipboardCheck, LoaderCircle, Send, X } from "lucide-react";
import { toast } from "sonner";
import {
  createProjectProgressUpdateAction,
  updateProjectProgressUpdateAction,
} from "@/actions/projects";
import type { ProjectProgressUpdateRecord } from "../progressUpdateTypes";
import { getManilaDateInputValue } from "../utils/progressUpdates";

export default function ProjectProgressUpdateForm({
  projectId,
  initialPercent,
  update,
  onCreated,
  onCancel,
  modalTitleId,
  compact = false,
}: {
  projectId: string;
  initialPercent: number;
  update?: ProjectProgressUpdateRecord;
  onCreated: (update: ProjectProgressUpdateRecord) => void;
  onCancel?: () => void;
  modalTitleId?: string;
  compact?: boolean;
}) {
  const [overallPercent, setOverallPercent] = useState(
    update?.overall_percent ?? initialPercent,
  );
  const [progressDate, setProgressDate] = useState(
    update?.progress_date ?? getManilaDateInputValue(),
  );
  const [completedWorkSummary, setCompletedWorkSummary] = useState(
    update?.completed_work_summary ?? "",
  );
  const [remarks, setRemarks] = useState(update?.remarks ?? "");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const savedUpdate = update
          ? await updateProjectProgressUpdateAction({
              updateId: update.id,
              projectId,
              overallPercent,
              completedWorkSummary,
              remarks,
              progressDate,
            })
          : await createProjectProgressUpdateAction({
              projectId,
              overallPercent,
              completedWorkSummary,
              remarks,
              progressDate,
            });
        onCreated(savedUpdate);
        setCompletedWorkSummary("");
        setRemarks("");
        toast.success(update ? "Progress update saved." : "Progress update submitted.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save progress update.");
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_6px_22px_rgba(15,23,42,.04)] sm:p-6"
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <ClipboardCheck size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 id={modalTitleId} className="text-base font-semibold text-slate-950">
              {update ? "Progress Update Details" : "Add Progress Update"}
            </h2>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              {update
                ? "Review and edit this submitted update."
                : "Enter the current overall progress manually."}
            </p>
          </div>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close update form"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            <X size={17} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className={compact ? "mt-4 space-y-4" : "mt-5 space-y-5"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Overall progress</span>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={overallPercent}
                onChange={(event) => setOverallPercent(Number(event.target.value))}
                aria-label="Overall progress percentage"
                className="h-2 min-w-0 flex-1 cursor-pointer accent-teal-700"
              />
              <div className="relative w-24 shrink-0">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={overallPercent}
                  autoFocus={compact}
                  onChange={(event) =>
                    setOverallPercent(Math.max(0, Math.min(100, Number(event.target.value))))
                  }
                  aria-label="Overall progress percentage value"
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 pr-8 text-right text-base font-bold text-slate-950 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  %
                </span>
              </div>
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Progress date</span>
            <input
              type="date"
              required
              value={progressDate}
              onChange={(event) => setProgressDate(event.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Completed work summary <span className="text-rose-500">*</span>
          </span>
          <textarea
            required
            maxLength={1000}
            rows={compact ? 4 : 6}
            value={completedWorkSummary}
            onChange={(event) => setCompletedWorkSummary(event.target.value)}
            placeholder="Summarize the work completed."
            className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
          <span className="mt-1 block text-right text-[11px] text-slate-400">
            {completedWorkSummary.length} / 1000
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Remarks</span>
          <textarea
            maxLength={600}
            rows={compact ? 3 : 4}
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="Add optional site notes."
            className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
          <span className="mt-1 block text-right text-[11px] text-slate-400">
            {remarks.length} / 600
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={pending || !completedWorkSummary.trim()}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
        {pending
          ? update
            ? "Saving..."
            : "Submitting..."
          : update
            ? "Save Changes"
            : "Submit Progress Update"}
      </button>
    </form>
  );
}
