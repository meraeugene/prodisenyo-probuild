"use client";
import {LoaderCircle,FileUp,Save,Send,Trash2} from 'lucide-react';
import {Field} from './ProgressWorksheetParts';
import type {useEngineeringProgressWorksheet} from '../hooks/useEngineeringProgressWorksheet';
import {formatPercent} from '../utils/progressWorksheet';
export default function ProgressWorksheetEditor({state,readOnly=false,isSubmitting=false}:{state:ReturnType<typeof useEngineeringProgressWorksheet>;readOnly?:boolean;isSubmitting?:boolean}) {
const {form,setForm,editingId,formErrors,setFormErrors,importError,setConfirmState,summary,submitLabel,hasActivities,hasUnsavedChanges,progressButtonLabel,resetForm,handleSubmit,handleImportFile,submitToCeo}=state;
return <>
      {!readOnly ? (
        <aside className="h-fit rounded-[7px] border border-slate-200 bg-white p-4 shadow-none">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-apple-charcoal">
              {editingId ? "Edit activity" : "Add activity"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Changes stay as a draft until submitted to CEO.
            </p>
            {hasUnsavedChanges ? (
              <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-semibold text-amber-800">
                You have unsent progress changes.
              </p>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3">
            <Field label="Activity" error={formErrors.activity}>
              <input
                value={form.activity}
                onChange={(event) =>
                  {
                    setForm((current) => ({ ...current, activity: event.target.value }));
                    setFormErrors((current) => ({ ...current, activity: undefined }));
                  }
                }
                aria-invalid={Boolean(formErrors.activity)}
                className={`mt-1 h-10 w-full rounded-md border bg-slate-50 px-3 text-sm outline-none transition focus:bg-white focus:ring-2 ${
                  formErrors.activity
                    ? "border-red-500 focus:border-red-600 focus:ring-red-100"
                    : "border-slate-200 focus:border-teal-600 focus:ring-teal-100"
                }`}
              />
            </Field>

            <Field label="% WT" error={formErrors.weightPercent}>
              <input
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                value={form.weightPercent}
                onChange={(event) =>
                  {
                    setForm((current) => ({ ...current, weightPercent: event.target.value }));
                    setFormErrors((current) => ({ ...current, weightPercent: undefined }));
                  }
                }
                aria-invalid={Boolean(formErrors.weightPercent)}
                className={`mt-1 h-10 w-full rounded-md border bg-slate-50 px-3 text-sm outline-none transition focus:bg-white focus:ring-2 ${
                  formErrors.weightPercent
                    ? "border-red-500 focus:border-red-600 focus:ring-red-100"
                    : "border-slate-200 focus:border-teal-600 focus:ring-teal-100"
                }`}
              />
            </Field>

            <Field label="Progress" error={formErrors.progressPercent}>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.progressPercent}
                onChange={(event) =>
                  {
                    setForm((current) => ({ ...current, progressPercent: event.target.value }));
                    setFormErrors((current) => ({ ...current, progressPercent: undefined }));
                  }
                }
                aria-invalid={Boolean(formErrors.progressPercent)}
                className={`mt-1 h-10 w-full rounded-md border bg-slate-50 px-3 text-sm outline-none transition focus:bg-white focus:ring-2 ${
                  formErrors.progressPercent
                    ? "border-red-500 focus:border-red-600 focus:ring-red-100"
                    : "border-slate-200 focus:border-teal-600 focus:ring-teal-100"
                }`}
                placeholder="0 to 100"
              />
            </Field>

            {importError ? <p className="text-xs font-semibold text-rose-700">{importError}</p> : null}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-[#076d69] px-3 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                {editingId ? <Save size={15} /> : null}
                {submitLabel}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            <div className={hasActivities ? "grid grid-cols-2 gap-2" : ""}>
              <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                <FileUp size={15} />
                Import Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="sr-only"
                  onChange={handleImportFile}
                />
              </label>
              {hasActivities ? (
                <button
                  type="button"
                  onClick={() => setConfirmState({ type: "delete-all" })}
                  className="flex h-10 items-center justify-center gap-2 rounded-md border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                  <Trash2 size={15} />
                  Delete all
                </button>
              ) : null}
            </div>
            <button
              type="button"
              disabled={!hasActivities || isSubmitting}
              onClick={submitToCeo}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-teal-800 px-3 text-sm font-semibold text-white transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={15} />}
              {isSubmitting ? "Submitting..." : progressButtonLabel}
            </button>
          </div>
        </aside>
      ) : (
        <aside className="h-fit rounded-[7px] border border-slate-200 bg-white p-4 shadow-none">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Overall progress
          </p>
          <p className="mt-2 text-3xl font-bold text-teal-800">
            {formatPercent(summary.overallProgress)}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-600"
              style={{ width: `${Math.min(summary.overallProgress, 100)}%` }}
            />
          </div>
       
        </aside>
      )}
</>;
}
