import { Step2Sort } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

const EVENING_OVERTIME_START_MINUTES = 18 * 60;
const END_OF_DAY_MINUTES = 24 * 60;

function earlierTime(current: string, incoming: string): string {
  if (!current) return incoming;
  return timeToMinutes(incoming) < timeToMinutes(current) ? incoming : current;
}

function laterTime(current: string, incoming: string): string {
  if (!current) return incoming;
  return timeToMinutes(incoming) > timeToMinutes(current) ? incoming : current;
}

function pairMinutes(inTime: string, outTime: string): number {
  if (!inTime || !outTime) return 0;
  const inMinutes = timeToMinutes(inTime);
  const outMinutes = timeToMinutes(outTime);
  if (outMinutes >= inMinutes) return outMinutes - inMinutes;
  return outMinutes + 24 * 60 - inMinutes;
}

function computeSameDayOvertimeMinutes(inTime: string, outTime: string): number {
  if (!inTime) return 0;

  const inMinutes = timeToMinutes(inTime);
  const outMinutes = outTime ? timeToMinutes(outTime) : -1;
  if (!Number.isFinite(inMinutes) || inMinutes < 0) return 0;

  const effectiveStart = Math.max(inMinutes, EVENING_OVERTIME_START_MINUTES);
  if (effectiveStart >= END_OF_DAY_MINUTES) return 0;

  if (!outTime || !Number.isFinite(outMinutes) || outMinutes < 0 || outMinutes <= inMinutes) {
    return END_OF_DAY_MINUTES - effectiveStart;
  }

  const effectiveEnd = Math.min(outMinutes, END_OF_DAY_MINUTES);
  return Math.max(0, effectiveEnd - effectiveStart);
}

function computeNextDayCarryMinutes(inTime: string, outTime: string): number {
  if (!inTime || !outTime) return 0;

  const inMinutes = timeToMinutes(inTime);
  const outMinutes = timeToMinutes(outTime);
  if (
    !Number.isFinite(inMinutes) ||
    !Number.isFinite(outMinutes) ||
    inMinutes < 0 ||
    outMinutes < 0
  ) {
    return 0;
  }

  if (outMinutes > inMinutes) return 0;
  return outMinutes;
}

function earliestNonEmptyTime(...times: string[]): string {
  const valid = times.filter(Boolean);
  if (valid.length === 0) return "";
  return valid.reduce((earliest, current) =>
    timeToMinutes(current) < timeToMinutes(earliest) ? current : earliest,
  );
}

function latestNonEmptyTime(...times: string[]): string {
  const valid = times.filter(Boolean);
  if (valid.length === 0) return "";
  return valid.reduce((latest, current) =>
    timeToMinutes(current) > timeToMinutes(latest) ? current : latest,
  );
}

function compareStep2Rows(
  aDate: string,
  aName: string,
  bDate: string,
  bName: string,
  sortMode: Step2Sort,
): number {
  if (sortMode === "date-asc") {
    if (aDate !== bDate) return aDate.localeCompare(bDate);
    return aName.localeCompare(bName);
  }
  if (sortMode === "date-desc") {
    if (aDate !== bDate) return bDate.localeCompare(aDate);
    return aName.localeCompare(bName);
  }
  if (sortMode === "name-asc") {
    if (aName !== bName) return aName.localeCompare(bName);
    return aDate.localeCompare(bDate);
  }
  if (aName !== bName) return bName.localeCompare(aName);
  return aDate.localeCompare(bDate);
}

export {
  earlierTime,
  laterTime,
  pairMinutes,
  computeSameDayOvertimeMinutes,
  computeNextDayCarryMinutes,
  earliestNonEmptyTime,
  latestNonEmptyTime,
  compareStep2Rows,
};
