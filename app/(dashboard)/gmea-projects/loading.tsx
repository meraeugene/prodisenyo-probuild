export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading GMEA projects"
      className="space-y-5 p-6"
    >
      <div className="h-12 w-72 animate-pulse rounded-xl bg-slate-100" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((n) => (
          <div
            key={n}
            className="h-40 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>
    </div>
  );
}
