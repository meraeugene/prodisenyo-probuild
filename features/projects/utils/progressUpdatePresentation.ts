export function clampProgressPercentage(value: number) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.max(0, Math.min(100, numericValue));
}

export function formatProgressPercentage(value: number) {
  return `${new Intl.NumberFormat("en-PH", {
    maximumFractionDigits: 2,
  }).format(clampProgressPercentage(value))}%`;
}

export function formatProgressDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(date);
}

export function formatProgressDateParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { month: "—", day: "—", year: "Date unavailable", time: "" };
  }

  const parts = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";

  return {
    month: part("month"),
    day: part("day"),
    year: part("year"),
    time: `${part("hour")}:${part("minute")} ${part("dayPeriod")}`.trim(),
  };
}
