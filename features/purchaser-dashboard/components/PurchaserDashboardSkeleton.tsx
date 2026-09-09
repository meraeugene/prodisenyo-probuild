export default function PurchaserDashboardSkeleton() {
  return (
    <main className="animate-pulse space-y-5 bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex min-h-[210px] items-center justify-between gap-4 rounded-[22px] bg-[#075e5b] p-8">
        <div><div className="h-3 w-32 rounded bg-white/20" /><div className="mt-3 h-9 w-64 rounded bg-white/25" /><div className="mt-3 h-4 w-96 max-w-full rounded bg-white/15" /></div>
        <div className="hidden h-11 w-72 rounded-xl bg-white/25 sm:block" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-28 rounded-2xl border border-slate-100 bg-slate-50" />)}
      </div>
      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,.8fr)]">
        <div className="h-96 rounded-2xl border border-slate-100 bg-slate-50" />
        <div className="h-96 rounded-2xl border border-slate-100 bg-slate-50" />
      </div>
    </main>
  );
}
