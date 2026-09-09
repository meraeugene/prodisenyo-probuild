import { SkeletonBlock as Block, SkeletonPanel, SkeletonRows } from "@/components/LoadingSkeleton";

export default function CeoDashboardSkeleton() {
  return (
    <main role="status" aria-label="Loading dashboard" className="min-h-full bg-[#f6f9f9] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="mb-6 rounded-3xl bg-[#075e5b] px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0"><Block light className="mb-3 h-6 w-28 rounded-full" /><Block light className="h-9 w-96 sm:h-10" /><Block light className="mt-2 h-5 w-[32rem]" /></div>
          <Block light className="h-10 w-44 shrink-0 rounded-xl" />
        </div>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, i) => <SkeletonPanel key={i} className="p-4"><div className="flex items-center justify-between gap-3"><Block className="h-4 w-24" /><Block className="h-8 w-8 shrink-0" /></div><Block className="mt-2 h-8 w-20" /><Block className="mt-2 h-4 w-36" />{i === 2 && <Block className="mt-3 h-1.5 w-full" />}</SkeletonPanel>)}</div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        {[0, 1, 2].map((index) => (
          <SkeletonPanel key={index} className="min-w-0 p-5">
            <Block className="h-5 w-36" />
            <Block className={index === 1 ? "mx-auto mt-6 h-40 w-40 rounded-full" : "mt-6 h-48 w-full rounded-xl"} />
            {index === 1 && <Block className="mt-4 h-10 w-full" />}
          </SkeletonPanel>
        ))}
      </div>
      <SkeletonPanel className="mt-5 p-0 overflow-hidden">
        <div className="px-5 py-5"><Block className="h-6 w-36" /><Block className="mt-1 h-4 w-64" /></div>
        <div className="hidden h-10 border-y border-slate-100 bg-slate-50 lg:block" />
        {Array.from({ length: 5 }, (_, i) => <div key={i} className="grid gap-4 border-b border-slate-100 px-5 py-4 lg:grid-cols-[minmax(220px,1.3fr)_minmax(110px,.65fr)_minmax(135px,.7fr)_minmax(120px,.65fr)_auto] lg:items-center"><div className="flex items-center gap-3"><Block className="h-14 w-20 shrink-0" /><div><Block className="h-4 w-32" /><Block className="mt-2 h-3 w-24" /></div></div>{Array.from({ length: 4 }, (_, j) => <Block key={j} className="h-8 w-24" />)}</div>)}
      </SkeletonPanel>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">{[0, 1].map(i => <SkeletonPanel key={i}><Block className="h-6 w-40" /><SkeletonRows /></SkeletonPanel>)}</div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,.72fr)_minmax(280px,.72fr)]">{[0, 1, 2].map(i => <SkeletonPanel key={i}><Block className="h-6 w-36" /><div className="mt-5 grid grid-cols-2 gap-3">{[0,1,2,3].map(j => <Block key={j} className="h-16 w-full" />)}</div></SkeletonPanel>)}</div>
      <SkeletonPanel className="mt-5"><Block className="h-6 w-40" /><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{Array.from({length:8}, (_, i) => <Block key={i} className="h-28 w-full" />)}</div></SkeletonPanel>
    </main>
  );
}
