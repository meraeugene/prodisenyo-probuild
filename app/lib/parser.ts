import type {
  Employee,
  EmployeeCalcDetails,
  EmployeeDailyLog,
} from "@/app/types";

export interface ParseResult {
  employees: Employee[];
  period: string;
  rawRows: number;
}

/**
 * Parses multiple attendance files and merges employees.
 */
export async function parseAttendanceFiles(
  files: File[],
): Promise<ParseResult> {
  const allEmployees: Employee[] = [];
  let period = "Current Period";
  let rawRows = 0;

  for (const file of files) {
    const parsed = await parseAttendanceFile(file);

    rawRows += parsed.rawRows;

    if (period === "Current Period" && parsed.period !== "Current Period") {
      period = parsed.period;
    }

    allEmployees.push(...parsed.employees);
  }

  return {
    employees: allEmployees,
    period,
    rawRows,
  };
}

/**
 * Parses a single file
 */
export async function parseAttendanceFile(file: File): Promise<ParseResult> {
  const branch = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/\s*\d{4}T[O0]?\d{4}.*/i, "")
    .trim();

  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "xls" || ext === "xlsx" || ext === "csv") {
    return parseSpreadsheet(file, branch);
  }

  throw new Error(`Unsupported file type: .${ext}`);
}

async function parseSpreadsheet(
  file: File,
  branch: string,
): Promise<ParseResult> {
  const XLSX = await import("xlsx");

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  const numberedSheets = workbook.SheetNames.filter((name) =>
    /^\s*\d+(?:\s*,\s*\d+)*\s*$/.test(name),
  );

  const targetSheets =
    numberedSheets.length > 0
      ? numberedSheets
      : [
          workbook.SheetNames.find(
            (n) =>
              n.toLowerCase().includes("summary") ||
              n.toLowerCase().includes("attend"),
          ) ?? workbook.SheetNames[0],
        ];

  const allEmployees: Employee[] = [];
  let rawRows = 0;
  let period = "Current Period";

  targetSheets.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    }) as unknown[][];

    rawRows += rows.length;

    if (period === "Current Period") {
      period = detectPeriod(rows) ?? period;
    }

    const extracted = extractEmployeesFromBlockLayout(rows, sheetName);

    extracted.forEach((e) => {
      e.branch = branch;
    });

    allEmployees.push(...extracted);
  });

  return {
    employees: allEmployees.sort((a, b) => a.id - b.id).slice(0, 500),
    period,
    rawRows,
  };
}

/**
 * Extract employees from biometric block layout
 */
function extractEmployeesFromBlockLayout(
  rows: unknown[][],
  sheetName: string,
): Employee[] {
  const headerRowIdx = rows.findIndex((row) =>
    (row as unknown[]).some((cell) => {
      const val = normaliseCell(cell);
      return val === "dept." || val === "department";
    }),
  );

  if (headerRowIdx < 0) {
    return extractEmployeesFallback(rows);
  }

  const headerRow = rows[headerRowIdx] as unknown[];

  const blockStarts: number[] = [];

  headerRow.forEach((cell, idx) => {
    const val = normaliseCell(cell);

    if (val === "dept." || val === "department") {
      blockStarts.push(idx);
    }
  });

  if (blockStarts.length === 0) {
    return extractEmployeesFallback(rows);
  }

  const employees: Employee[] = [];

  const summaryValuesRow = (rows[headerRowIdx + 4] ?? []) as unknown[];
  const idRow = (rows[headerRowIdx + 1] ?? []) as unknown[];

  blockStarts.forEach((start, i) => {
    const idRaw = String(idRow[start + 9] ?? "").trim();
    const parsedId = parseInt(idRaw, 10);

    if (!Number.isFinite(parsedId)) return;

    const employeeId = parsedId;

    const nameRaw = String(headerRow[start + 9] ?? "").trim();

    const days = clampNumber(toNumber(summaryValuesRow[start + 4]) ?? 0, 0, 31);

    const otNormalRaw = String(summaryValuesRow[start + 5] ?? "").trim();
    const otSpecialRaw = String(summaryValuesRow[start + 7] ?? "").trim();

    const otNormal = parseDurationHours(otNormalRaw);
    const otSpecial = parseDurationHours(otSpecialRaw);

    const otHours = clampNumber(otNormal + otSpecial, 0, 50);

    const details: EmployeeCalcDetails = {
      sourceSheet: sheetName,
      absencesDay: toNumber(summaryValuesRow[start + 0]) ?? 0,
      leaveDay: toNumber(summaryValuesRow[start + 1]) ?? 0,
      businessTripDay: toNumber(summaryValuesRow[start + 2]) ?? 0,
      attendanceDay: days,
      otNormalRaw,
      otSpecialRaw,
      otNormalHours: roundTo1(otNormal),
      otSpecialHours: roundTo1(otSpecial),
      dailyLogs: extractDailyLogs(rows, headerRowIdx + 9, start),
    };

    employees.push({
      id: employeeId,
      name: nameRaw || `Employee ${employeeId}`,
      days: roundTo1(days),
      regularHours: roundTo1(days * 8),
      otHours: roundTo1(otHours),
      customRateDay: null,
      customRateHour: null,
      calcDetails: details,
    });
  });

  return employees;
}

function extractDailyLogs(
  rows: unknown[][],
  startRow: number,
  startCol: number,
): EmployeeDailyLog[] {
  const logs: EmployeeDailyLog[] = [];

  for (let r = startRow; r < rows.length; r++) {
    const row = (rows[r] ?? []) as unknown[];

    const dateWeek = String(row[startCol] ?? "").trim();

    if (!dateWeek) {
      if (logs.length > 0) break;
      continue;
    }

    logs.push({
      dateWeek,
      time1In: String(row[startCol + 1] ?? "").trim(),
      time1Out: String(row[startCol + 3] ?? "").trim(),
      time2In: String(row[startCol + 6] ?? "").trim(),
      time2Out: String(row[startCol + 8] ?? "").trim(),
      otIn: String(row[startCol + 10] ?? "").trim(),
      otOut: String(row[startCol + 12] ?? "").trim(),
    });
  }

  return logs;
}

function extractEmployeesFallback(rows: unknown[][]): Employee[] {
  const employees: Employee[] = [];

  rows.forEach((row, i) => {
    const name = String(row[1] ?? "").trim();

    if (!name) return;

    employees.push({
      id: i + 1,
      name,
      days: 0,
      regularHours: 0,
      otHours: 0,
      customRateDay: null,
      customRateHour: null,
    });
  });

  return employees;
}

function detectPeriod(rows: unknown[][]): string | null {
  for (const row of rows.slice(0, 10)) {
    const joined = (row as unknown[]).map((c) => String(c ?? "")).join(" ");

    const dateMatch = joined.match(
      /(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})/,
    );

    if (dateMatch) {
      return `${dateMatch[1]} to ${dateMatch[2]}`;
    }
  }

  return null;
}

function normaliseCell(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(value: unknown): number | null {
  const raw = String(value ?? "").trim();

  if (!raw) return null;

  const parsed = parseFloat(raw);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseDurationHours(value: unknown): number {
  const raw = String(value ?? "").trim();

  const hhmm = raw.match(/^(\d{1,2}):(\d{2})\+?$/);

  if (hhmm) {
    const h = parseInt(hhmm[1], 10);
    const m = parseInt(hhmm[2], 10);

    return h + m / 60;
  }

  const numeric = parseFloat(raw);

  return Number.isFinite(numeric) ? numeric : 0;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundTo1(value: number): number {
  return Math.round(value * 10) / 10;
}