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
      (completed
        ? inverse ? "bg-green-200 text-green-950" : "bg-green-100 text-green-800"
        : "bg-yellow-200 text-yellow-900")
    }>
      {completed ? "Completed" : "Ongoing"}
    </span>
  );
}
