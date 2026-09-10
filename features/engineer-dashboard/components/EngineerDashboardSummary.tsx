import { CheckCircle2, FileText, Folder, Layers3 } from "lucide-react";

const ITEMS = [
  { key: "projects", label: "Total projects", caption: "All assigned records", icon: Folder, tone: "blue" },
  { key: "active", label: "Active projects", caption: "In progress", icon: Layers3, tone: "teal" },
  { key: "estimates", label: "Pending estimates", caption: "Not operational yet", icon: FileText, tone: "amber" },
  { key: "completed", label: "Completed", caption: "Finished projects", icon: CheckCircle2, tone: "emerald" },
] as const;

export default function EngineerDashboardSummary({
  values,
}: {
  values: Record<(typeof ITEMS)[number]["key"], number>;
}) {
  return (
    <section aria-label="Engineer workflow summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {ITEMS.map(({ key, label, caption, icon: Icon, tone }) => (
        <article
          key={key}
          className="relative min-h-36 overflow-hidden rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.055)]"
        >
          <div className="relative z-10 flex items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tone === "blue" ? "bg-blue-50 text-blue-600" : tone === "amber" ? "bg-amber-50 text-amber-600" : "bg-teal-50 text-teal-700"}`}>
              <Icon size={26} strokeWidth={1.9} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-1 text-4xl font-semibold tracking-[-0.045em] text-slate-950">{values[key]}</p>
              <p className="mt-1 text-xs text-slate-400">{caption}</p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
