import type {
  CreateProjectProgressUpdateInput,
  ProjectProgressUpdateRecord,
} from "../progressUpdateTypes";

export function normalizeProgressUpdateInput(input: CreateProjectProgressUpdateInput) {
  const projectId = input.projectId.trim();
  const overallPercent = Math.round(Number(input.overallPercent) * 100) / 100;
  const completedWorkSummary = input.completedWorkSummary.trim();
  const remarks = input.remarks?.trim() || null;
  const progressDate = input.progressDate?.trim() || getManilaDateInputValue();

  if (!projectId) throw new Error("Project is required.");
  if (!Number.isFinite(overallPercent) || overallPercent < 0 || overallPercent > 100) {
    throw new Error("Overall progress must be between 0 and 100.");
  }
  if (!completedWorkSummary || completedWorkSummary.length > 1000) {
    throw new Error("Completed work summary is required and must be 1000 characters or fewer.");
  }
  if (remarks && remarks.length > 600) {
    throw new Error("Remarks must be 600 characters or fewer.");
  }
  if (!isValidDateInput(progressDate)) {
    throw new Error("Enter a valid progress date.");
  }

  return { projectId, overallPercent, completedWorkSummary, remarks, progressDate };
}

export function getManilaDateInputValue(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Manila",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function selectLatestProgressUpdate(
  updates: ProjectProgressUpdateRecord[],
) {
  return sortProgressUpdatesNewestFirst(updates)[0] ?? null;
}

export function sortProgressUpdatesNewestFirst(
  updates: ProjectProgressUpdateRecord[],
) {
  return [...updates]
    .filter((update) => Number.isFinite(Date.parse(update.created_at)))
    .sort(
      (left, right) =>
        getProgressSortTime(right) - getProgressSortTime(left) ||
        Date.parse(right.created_at) - Date.parse(left.created_at),
    );
}

function getProgressSortTime(update: ProjectProgressUpdateRecord) {
  return update.progress_date
    ? Date.parse(`${update.progress_date}T00:00:00Z`)
    : Date.parse(update.created_at);
}

export function getLatestProgressUpdatePercentage(
  updates: ProjectProgressUpdateRecord[],
) {
  const latest = selectLatestProgressUpdate(updates);
  if (!latest) return null;
  return Math.max(0, Math.min(100, Math.round(Number(latest.overall_percent))));
}
