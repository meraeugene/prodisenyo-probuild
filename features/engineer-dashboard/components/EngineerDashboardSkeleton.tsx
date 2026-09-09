export default function EngineerDashboardSkeleton() {
  return (
    <main className="min-h-full bg-white p-4 sm:p-6 lg:p-8" aria-busy="true" aria-label="Loading engineer dashboard">
      <div className="mx-auto max-w-[1500px] animate-pulse space-y-5">
        <div className="flex min-h-[210px] items-center justify-between rounded-[22px] bg-[#075e5b] p-8">
          <div className="space-y-3"><div className="h-3 w-32 rounded bg-white/25" /><div className="h-9 w-72 rounded bg-white/25" /><div className="h-4 w-64 rounded bg-white/15" /></div>
          <div className="hidden h-12 w-72 rounded-xl bg-white/25 sm:block" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-28 rounded-[22px] bg-white shadow-sm ring-1 ring-slate-100" />)}</div>
        <div className="h-[360px] rounded-2xl bg-white shadow-sm ring-1 ring-slate-100" />
        <div className="grid gap-5 lg:grid-cols-2"><div className="h-72 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100" /><div className="h-72 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100" /></div>
      </div>
    </main>
  );
}
