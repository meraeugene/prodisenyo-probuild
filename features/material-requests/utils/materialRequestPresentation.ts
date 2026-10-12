import type {MaterialRequestPriority} from '../types';
export function inputClass(hasError: boolean) {
  return `h-9 rounded-[5px] w-full border px-3 text-sm text-apple-charcoal outline-none transition focus:border-[#076d69] ${
    hasError
      ? "border-rose-400 ring-1 ring-rose-200"
      : "border-apple-mist bg-white"
  }`;
}

export function priorityBadgeClass(priority: MaterialRequestPriority) {
  if (priority === "urgent") return "border-rose-200 bg-rose-50 text-rose-700";
  if (priority === "high") return "border-amber-200 bg-amber-50 text-amber-700";
  if (priority === "medium") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-teal-200 bg-teal-50 text-teal-700";
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

