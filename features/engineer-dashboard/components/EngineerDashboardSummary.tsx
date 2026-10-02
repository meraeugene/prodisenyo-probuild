const ITEMS = [
  { key: "projects", label: "Total projects", caption: "All assigned records",  tone: "blue" },
  { key: "active", label: "Active projects", caption: "In progress",  tone: "teal" },
  { key: "estimates", label: "Pending estimates", caption: "Not operational yet",  tone: "amber" },
  { key: "completed", label: "Completed", caption: "Finished projects",  tone: "emerald" },
] as const;

export default function EngineerDashboardSummary({
  values,
}: {
  values: Record<(typeof ITEMS)[number]["key"], number>;
}) {
  return (
    <section aria-label="Engineer workflow summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {ITEMS.map(({ key, label, caption }) => (
        <article
          key={key}
          className="relative min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_30px_-25px_rgba(15,23,42,.2)]"
        >
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-xs font-medium text-slate-500">{label}</p>
          </div>
          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 tabular-nums">{values[key]}</p>
          <p className="mt-1 text-[11px] leading-4 text-slate-500">{caption}</p>
        </article>
      ))}
    </section>
  );
}
