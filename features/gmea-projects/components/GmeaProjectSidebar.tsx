import { CalendarDays, CheckCircle2, Circle, Clock3, MapPin, UserRound } from "lucide-react";
import type { GmeaProject } from "../types";
import { contractCollectionSummary, paymentTermSummary } from "../utils/gmeaCalculations";
import { formatProjectDuration } from "../utils/gmeaFormatters";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }).format(date);
}

export default function GmeaProjectSidebar({ project, canEdit, onEdit }: {
  project: GmeaProject;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const collection = contractCollectionSummary(project);
  const percentage = project.contract_amount > 0 ? Math.min(100, Math.round(collection.received / project.contract_amount * 100)) : 0;
  const details = [
    { label: "Location", value: project.location || "Not set", icon: MapPin },
    { label: "Client", value: project.client || "Not set", icon: UserRound },
    { label: "Created", value: formatDate(project.created_at), icon: CalendarDays },
    { label: "Duration", value: formatProjectDuration(project.duration), icon: Clock3 },
  ];

  return (
    <aside className="space-y-4">
      <section className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,.045)]">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-950">Project progress</h2><span className="text-sm font-semibold text-slate-950">{percentage}%</span></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600 transition-[width]" style={{ width: `${percentage}%` }} /></div>
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3 text-sm"><CheckCircle2 size={19} className="shrink-0 text-teal-600" /><span className="min-w-0 flex-1 font-medium text-slate-800">Contract signed</span><span className="text-xs text-slate-500">{formatDate(project.created_at)}</span></div>
          {project.payment_terms.slice(0, 4).map((term) => {
            const summary = paymentTermSummary(term);
            const paid = summary.status === "paid";
            return <div key={term.id} className="flex items-center gap-3 text-sm">{paid ? <CheckCircle2 size={19} className="shrink-0 text-teal-600" /> : <Circle size={19} className="shrink-0 fill-slate-100 text-slate-200" />}<span className={`min-w-0 flex-1 truncate ${paid ? "font-medium text-slate-800" : "text-slate-500"}`}>{term.description}</span><span className="text-xs capitalize text-slate-500">{summary.status}</span></div>;
          })}
        </div>
      </section>
      <section className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,.045)]">
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-slate-950">Project details</h2>{canEdit && <button type="button" onClick={onEdit} className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Edit</button>}</div>
        <dl className="mt-5 space-y-4">{details.map(({ label, value, icon: Icon }) => <div key={label} className="grid grid-cols-[20px_86px_minmax(0,1fr)] items-start gap-2 text-sm"><Icon size={17} className="mt-0.5 text-slate-500" /><dt className="text-slate-500">{label}</dt><dd className="font-medium text-slate-800">{value}</dd></div>)}</dl>
      </section>
    </aside>
  );
}
