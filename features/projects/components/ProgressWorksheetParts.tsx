import type { ReactNode } from 'react';
import type { ProgressDraftActivity } from '../worksheetTypes';
import { formatPercent } from '../utils/progressWorksheet';

export function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

export function ProgressSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="grid grid-cols-[48px_1fr_96px_128px_72px] gap-3">
          <div className="h-9 animate-pulse rounded bg-slate-100" />
          <div className="h-9 animate-pulse rounded bg-slate-100" />
          <div className="h-9 animate-pulse rounded bg-slate-100" />
          <div className="h-9 animate-pulse rounded bg-slate-100" />
          <div className="h-9 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function ProgressMetrics({ activity }: { activity: ProgressDraftActivity }) {
  return (
    <dl className="grid grid-cols-2 gap-2 text-xs">
      <div className="rounded-md border border-slate-100 bg-white p-2">
        <dt className="font-semibold text-slate-500">% WT</dt>
        <dd className="mt-1 font-bold text-apple-charcoal">
          {formatPercent(activity.weightPercent)}
        </dd>
      </div>
      <div className="rounded-md border border-teal-100 bg-teal-50 p-2">
        <dt className="font-semibold text-teal-700">Progress</dt>
        <dd className="mt-1 font-bold text-teal-800">
          {formatPercent(activity.progressPercent)}
        </dd>
      </div>
    </dl>
  );
}
