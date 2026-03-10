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
  earliestNonEmptyTime,
  latestNonEmptyTime,
  compareStep2Rows,
};
