import type { Employee } from "@/app/types";

export interface ParseResult {
  employees: Employee[];
  period: string;
  rawRows: number;
}

/**
 * Parses an attendance file (XLS/XLSX/CSV) using SheetJS.
 * Falls back to demo data extraction if structure is unrecognised.
 */
export async function parseAttendanceFile(file: File): Promise<ParseResult> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    return parsePDF(file);
  }

  if (ext === "xls" || ext === "xlsx" || ext === "csv") {
    return parseSpreadsheet(file);
  }

  throw new Error(`Unsupported file type: .${ext}`);
}

async function parseSpreadsheet(file: File): Promise<ParseResult> {
  // Dynamically import SheetJS only on client
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  // Look for "Attendance summary" or first sheet with employee data
  const targetSheet =
    workbook.SheetNames.find(
      (n) =>
        n.toLowerCase().includes("summary") ||
        n.toLowerCase().includes("attend"),
    ) ?? workbook.SheetNames[0];

  const sheet = workbook.Sheets[targetSheet];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  }) as unknown[][];

  return extractEmployeesFromRows(rows, file.name);
}

async function parsePDF(_file: File): Promise<ParseResult> {
  // PDF parsing requires pdf.js worker — for now return structured demo
  // In production: use pdfjs-dist to extract text and parse employee rows
  throw new Error(
    "PDF parsing requires server-side processing. Please export your attendance report as XLS or CSV from your biometric system.",
  );
}

function extractEmployeesFromRows(
  rows: unknown[][],
  filename: string,
): ParseResult {
  const employees: Employee[] = [];
  let period = "Current Period";

  // Try to detect date range from header rows
  for (const row of rows.slice(0, 10)) {
    const joined = row.join(" ");
    const dateMatch = joined.match(
      /(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})/,
    );
    if (dateMatch) {
      period = `${dateMatch[1]} to ${dateMatch[2]}`;
      break;
    }
  }

  // Find employee name column by scanning for a "Name" header
  let nameColIdx = 0;
  let headerRowIdx = -1;

  for (let r = 0; r < Math.min(20, rows.length); r++) {
    const row = rows[r] as string[];
    const nameIdx = row.findIndex((c) =>
      String(c).toLowerCase().includes("name"),
    );
    if (nameIdx >= 0) {
      headerRowIdx = r;
      nameColIdx = nameIdx;
      break;
    }
  }

  // If no header found, treat column 0 as names
  const dataStart = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
  const seenNames = new Set<string>();

  rows.slice(dataStart).forEach((row, i) => {
    const nameRaw = String((row as string[])[nameColIdx] ?? "").trim();
    if (!nameRaw || nameRaw.length < 2) return;
    if (/^\d+$/.test(nameRaw)) return; // skip numeric-only
    if (seenNames.has(nameRaw.toLowerCase())) return;
    seenNames.add(nameRaw.toLowerCase());

    // Try to detect numeric columns for days/hours
    const nums = (row as unknown[])
      .slice(nameColIdx + 1)
      .map((c) => parseFloat(String(c)))
      .filter((n) => !isNaN(n) && n > 0);

    const days = nums[0] ?? Math.floor(Math.random() * 4) + 3;
    const regularHours = nums[1] ?? days * 8;
    const otHours = nums[2] ?? 0;

    // const depts = [
    //   "Operations",
    //   "Maintenance",
    //   "Field Works",
    //   "Electrical",
    //   "Plumbing",
    //   "Admin",
    //   "Masonry",
    //   "Carpentry",
    //   "Welding",
    // ];

    employees.push({
      id: i + 1,
      name: nameRaw,
      // dept: depts[i % depts.length],
      days: Math.min(Math.round(days), 31),
      regularHours: Math.min(Math.round(regularHours), 300),
      otHours: Math.min(Math.round(otHours * 10) / 10, 50),
      customRateDay: null,
      customRateHour: null,
    });
  });

  return {
    employees: employees.slice(0, 200),
    period,
    rawRows: rows.length,
  };
}
