export default function GmeaRentalsLoading() {
  return (
    <main className="min-h-full bg-white px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8">
      <div className="mx-auto max-w-[1440px] animate-pulse space-y-5" aria-label="Loading Rentals">
        <div className="h-40 rounded-[22px] bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-28 rounded-2xl bg-slate-100" />
          <div className="h-28 rounded-2xl bg-slate-100" />
          <div className="h-28 rounded-2xl bg-slate-100" />
        </div>
        <div className="h-72 rounded-2xl bg-slate-100" />
      </div>
    </main>
  );
}
