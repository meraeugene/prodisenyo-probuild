function Pulse({ className }: { className: string }) {
  return <div className={"animate-pulse rounded-lg bg-slate-100 " + className} />;
}

export default function GmeaProjectWorkspaceSkeleton() {
  return (
    <div role="status" aria-label="Loading GMEA project details" className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Pulse className="h-5 w-32" />
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-3"><Pulse className="h-3 w-56" /><Pulse className="h-9 w-80 max-w-full" /><Pulse className="h-4 w-64" /></div>
        <div className="flex gap-2"><Pulse className="h-10 w-28" /><Pulse className="h-10 w-32" /></div>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="space-y-3 rounded-2xl border border-slate-200 p-4"><Pulse className="h-3 w-28" /><Pulse className="h-7 w-32" /></div>
        ))}
      </div>
      <div className="flex gap-2 overflow-hidden border-b border-slate-200 pb-3"><Pulse className="h-8 w-40 shrink-0" /><Pulse className="h-8 w-24 shrink-0" /><Pulse className="h-8 w-44 shrink-0" /></div>
      <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="space-y-2"><Pulse className="h-3 w-28" /><Pulse className="h-5 w-44" /></div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
