import type { ProjectRecord } from "../types";

export default function CeoProjectsSummary({ projects }: { projects: ProjectRecord[] }) {
  const entries = [
    { label: "Total Projects", value: projects.length, note: "All project records", tone: "text-emerald-700" },
    { label: "Active Projects", value: projects.filter((project) => project.status === "active").length, note: "Currently in progress", tone: "text-emerald-700" },
    { label: "Pending Estimates", value: projects.filter((project) => project.status === "planning").length, note: "Awaiting cost estimate", tone: "text-rose-600" },
    { label: "Completed Projects", value: projects.filter((project) => project.status === "completed").length, note: "Successfully delivered", tone: "text-emerald-700" },
    { label: "On Hold", value: projects.filter((project) => project.status === "on_hold").length, note: "Requires follow-up", tone: "text-rose-600" },
  ];

  return (
    <section aria-label="Project portfolio summary" className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-5">
      {entries.map((entry, index) => (
        <article key={entry.label} className={`min-w-0 px-5 py-4 ${index ? "border-t border-slate-200 sm:border-l xl:border-t-0" : ""}`}>
          <p className="truncate whitespace-nowrap text-xs font-semibold text-slate-700">{entry.label}</p>
          <div className="mt-2 flex items-end gap-4">
            <p className="text-[34px] font-bold leading-none tracking-[-0.045em] text-slate-950 tabular-nums">{entry.value}</p>
            <p className={`mb-0.5 truncate whitespace-nowrap text-[10px] font-semibold ${entry.tone}`}>{entry.note}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
