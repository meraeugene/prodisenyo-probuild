"use client";
import {Pencil,Trash2} from 'lucide-react';
import {ProgressSkeleton,ProgressMetrics} from './ProgressWorksheetParts';
import type {useEngineeringProgressWorksheet} from '../hooks/useEngineeringProgressWorksheet';
import {formatPercent} from '../utils/progressWorksheet';
export default function ProgressWorksheetTable({state,readOnly=false}:{state:ReturnType<typeof useEngineeringProgressWorksheet>;readOnly?:boolean;isSubmitting?:boolean}) {
const {setConfirmState,importing,sortedActivities,summary,hasActivities,handleEdit}=state;
return <>      <div className="overflow-hidden rounded-[7px] border border-slate-200 bg-white shadow-none">
        {importing ? <ProgressSkeleton /> : null}
        {!importing ? <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[620px] text-left text-sm">
            <caption id="worksheet-title" className="sr-only">
              Engineering progress activities
            </caption>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-12 border-r border-slate-100 px-2 py-2 text-center">Item</th>
                <th className="border-r border-slate-100 px-2 py-2">Activity</th>
                <th className="w-24 border-r border-slate-100 px-2 py-2 text-right">% WT</th>
                <th className="w-32 border-r border-slate-100 px-2 py-2 text-right">Progress</th>
                {!readOnly ? <th className="w-20 px-2 py-2 text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedActivities.map((activity, index) => (
                <tr key={activity.id} className="transition even:bg-slate-50/40 hover:bg-teal-50/40">
                  <td className="border-r border-slate-100 px-2 py-2 text-center font-semibold text-slate-500">
                    {index + 1}
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2 font-semibold text-apple-charcoal">
                    {activity.activity}
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2 text-right font-semibold">
                    {formatPercent(activity.weightPercent)}
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2 text-right">
                    <div className="ml-auto flex max-w-[118px] items-center gap-1.5">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-teal-600"
                          style={{ width: `${activity.progressPercent}%` }}
                        />
                      </div>
                      <span className="w-14 text-right font-bold text-teal-700">
                        {formatPercent(activity.progressPercent)}
                      </span>
                    </div>
                  </td>
                  {!readOnly ? (
                    <td className="px-2 py-2">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(activity)}
                          aria-label={`Edit ${activity.activity}`}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-teal-50 hover:text-teal-700"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmState({ type: "delete-one", activity })}
                          aria-label={`Delete ${activity.activity}`}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
            {hasActivities ? (
              <tfoot className="border-t border-slate-200 bg-slate-50 text-sm">
                <tr>
                  <td className="border-r border-slate-100 px-2 py-2" colSpan={3} />
                  <td className="border-r border-slate-100 px-2 py-2 text-right font-bold text-apple-charcoal">
                    <span className="block w-full rounded-sm bg-teal-500 px-2 py-1 text-center font-bold text-teal-950">
                      {formatPercent(summary.overallProgress)}
                    </span>
                  </td>
                  {!readOnly ? <td className="px-2 py-2" /> : null}
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div> : null}

        {!importing ? <div className="divide-y divide-slate-100 md:hidden">
          {sortedActivities.map((activity, index) => (
            <article key={activity.id} className="space-y-3 p-4 even:bg-slate-50/50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Item {index + 1}
                  </p>
                  <h3 className="mt-1 text-sm font-bold text-apple-charcoal">
                    {activity.activity}
                  </h3>
                </div>
                {!readOnly ? (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(activity)}
                      aria-label={`Edit ${activity.activity}`}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-teal-50 hover:text-teal-700"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmState({ type: "delete-one", activity })}
                      aria-label={`Delete ${activity.activity}`}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : null}
              </div>
              <ProgressMetrics activity={activity} />
            </article>
          ))}
          {hasActivities ? (
            <div className="bg-slate-50 p-4 text-right text-xs">
              <div className="inline-flex rounded-md border border-teal-100 bg-teal-50 px-3 py-2">
                <p className="font-bold text-teal-900">
                  {formatPercent(summary.overallProgress)}
                </p>
              </div>
            </div>
          ) : null}
        </div> : null}

        {!importing && !hasActivities ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-slate-600">
              No weighted activities yet.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Add or import activities to start calculating project progress.
            </p>
          </div>
        ) : null}
      </div>
</>;
}
