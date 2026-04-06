import type { DailyLogRow } from "@/types";

const SNAPSHOT_START = "[[LOG_SNAPSHOT]]";
const SNAPSHOT_END = "[[/LOG_SNAPSHOT]]";

function normalizeLogRow(log: DailyLogRow): DailyLogRow {
  return {
    date: String(log.date ?? ""),
    employee: String(log.employee ?? ""),
    time1In: String(log.time1In ?? ""),
    time1Out: String(log.time1Out ?? ""),
    time2In: String(log.time2In ?? ""),
    time2Out: String(log.time2Out ?? ""),
    otIn: String(log.otIn ?? ""),
    otOut: String(log.otOut ?? ""),
    hours: Number.isFinite(log.hours) ? Math.round(log.hours * 100) / 100 : 0,
    site: String(log.site ?? ""),
  };
}

export function parseOvertimeRequestNotes(notes: string | null | undefined): {
  displayNotes: string;
  editedLogs: DailyLogRow[];
} {
  const source = String(notes ?? "");
  const startIndex = source.indexOf(SNAPSHOT_START);
  const endIndex = source.indexOf(SNAPSHOT_END);

  if (startIndex < 0 || endIndex < startIndex) {
    return {
      displayNotes: source.trim(),
      editedLogs: [],
    };
  }

  const displayNotes = `${source.slice(0, startIndex)}${source.slice(
    endIndex + SNAPSHOT_END.length,
  )}`.trim();
  const snapshotRaw = source
    .slice(startIndex + SNAPSHOT_START.length, endIndex)
    .trim();

  try {
    const parsed = JSON.parse(snapshotRaw);
    const editedLogs = Array.isArray(parsed)
      ? parsed.map((item) => normalizeLogRow(item as DailyLogRow))
      : [];

    return {
      displayNotes,
      editedLogs,
    };
  } catch {
    return {
      displayNotes,
      editedLogs: [],
    };
  }
}

export function buildOvertimeRequestNotes(
  notes: string,
  editedLogs: DailyLogRow[],
): string {
  const { displayNotes } = parseOvertimeRequestNotes(notes);
  const safeNotes = displayNotes.trim();
  const snapshot = JSON.stringify(editedLogs.map((log) => normalizeLogRow(log)));

  return `${safeNotes || "Overtime request"}\n${SNAPSHOT_START}\n${snapshot}\n${SNAPSHOT_END}`;
}
