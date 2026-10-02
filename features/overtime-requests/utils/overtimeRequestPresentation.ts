import type { OvertimeRequestRecord } from "../types";

export function formatOvertimeRequestDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getOvertimeRequestStatusClasses(status: OvertimeRequestRecord["status"]) {
  if (status === "approved")
    return "border-teal-200 bg-teal-50 text-teal-700";
  if (status === "rejected")
    return "border-[#ccfbf1] bg-[#f0fdfa] text-[#0f766e]";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function getOvertimeRequestStatusLabel(status: OvertimeRequestRecord["status"]) {
  if (status === "rejected") return "returned";
  return status;
}

