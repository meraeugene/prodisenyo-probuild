function Pulse({ className }: { className: string }) {
  return <div className={"animate-pulse rounded-lg bg-slate-100 " + className} />;
}

export default function GmeaProjectsPageSkeleton() {
  return (
    <div role="status" aria-label="Loading GMEA projects" className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <Pulse className="h-3 w-56" /><Pulse className="h-9 w-72" /><Pulse className="h-4 w-[28rem] max-w-full" />
        </div>
        <Pulse className="h-10 w-32" />
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="space-y-3 rounded-2xl border border-slate-200 p-5"><Pulse className="h-3 w-28" /><Pulse className="h-8 w-40" /></div>
        ))}
      </div>
      <Pulse className="h-10 w-full sm:max-w-md" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <Pulse className="h-6 w-6" /><Pulse className="h-6 w-3/4" /><Pulse className="h-4 w-1/2" /><Pulse className="h-4 w-2/3" />
            <div className="grid grid-cols-2 gap-3 border-y border-slate-100 py-4"><Pulse className="h-12 w-full" /><Pulse className="h-12 w-full" /></div>
            <Pulse className="h-10 w-48" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
