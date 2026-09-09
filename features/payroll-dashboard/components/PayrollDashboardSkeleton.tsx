import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";

function PanelHeading() {
  return <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><Block className="h-6 w-48" /><Block className="mt-0.5 h-4 w-56" /></div><Block className="h-4 w-16" /></div>;
}

function TableRows({ columns, minWidth }: { columns: number; minWidth: string }) {
  return <div className="overflow-hidden"><div className={minWidth}><div className="h-10 bg-slate-50/80" />{[0,1,2].map(row => <div key={row} className="grid items-center gap-4 border-t border-slate-100 px-5 py-3.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{Array.from({ length: columns }, (_, column) => <div key={column}><Block className="h-4 w-24" />{column < 2 && <Block className="mt-1 h-3 w-20" />}</div>)}</div>)}</div></div>;
}

export default function PayrollDashboardSkeleton() {
  return (
    <main role="status" aria-label="Loading payroll dashboard" className="min-h-full bg-slate-50/40 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><Block className="h-8 w-72 sm:h-9" /><Block className="mt-1 h-5 w-96" /></div>
        <Block className="h-10 w-44 shrink-0 rounded-lg" />
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0,1,2,3].map(i => <SkeletonPanel key={i} className="rounded-xl p-4"><div className="flex items-start gap-3"><Block className="h-10 w-10 shrink-0" /><div><Block className="h-4 w-32" /><Block className="mt-1 h-7 w-24" /></div></div></SkeletonPanel>)}
      </div>
      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.75fr)]">
        <SkeletonPanel className="overflow-hidden p-0"><PanelHeading /><TableRows columns={6} minWidth="min-w-[780px]" /></SkeletonPanel>
        <SkeletonPanel>
          <div className="flex justify-between gap-3"><div><Block className="h-6 w-36" /><Block className="mt-0.5 h-4 w-44" /></div><Block className="h-4 w-20" /></div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">{[0,1,2,3].map(i => <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-100 p-3"><Block className="h-8 w-8 shrink-0 rounded-full" /><div><Block className="h-3 w-20" /><Block className="mt-0.5 h-5 w-20" /></div></div>)}</div>
          <div className="mt-2 grid items-center gap-1 sm:grid-cols-[160px_minmax(0,1fr)]"><div className="flex h-44 items-center justify-center"><div className="h-[136px] w-[136px] animate-pulse rounded-full border-[22px] border-slate-200/70 motion-reduce:animate-none" /></div><div className="space-y-3">{[0,1,2].map(i => <div key={i} className="flex justify-between gap-3"><Block className="h-4 w-24" /><Block className="h-4 w-16" /></div>)}</div></div>
          <Block className="mt-4 h-10 w-full" />
        </SkeletonPanel>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4">
        <SkeletonPanel className="overflow-hidden p-0"><PanelHeading /><TableRows columns={4} minWidth="min-w-[660px]" /></SkeletonPanel>
        <SkeletonPanel><Block className="h-6 w-32" /><Block className="mt-0.5 h-4 w-60" /><div className="mt-4 divide-y divide-slate-100">{[0,1,2,3,4].map(i => <div key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0"><Block className="h-9 w-9 shrink-0 rounded-full" /><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><Block className="h-5 w-40" /><Block className="h-3 w-20" /></div><Block className="mt-0.5 h-4 w-48" /><Block className="mt-1 h-3 w-24" /></div></div>)}</div></SkeletonPanel>
      </div>
    </main>
  );
}
