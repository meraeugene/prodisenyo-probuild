import type { GmeaProject } from "../types";

export default function GmeaProjectStatusBadge({
  status,
  inverse = false,
}: {
  status: GmeaProject["status"];
  inverse?: boolean;
}) {
  const completed = status === "completed";
    return (
    <span className={
      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold " +
      (inverse
        ? completed ? "bg-white/20 text-white" : "bg-emerald-300/20 text-emerald-50"
        : completed ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700")
    }>
      {completed ? "Completed" : "Active"}
    </span>
  );
}
