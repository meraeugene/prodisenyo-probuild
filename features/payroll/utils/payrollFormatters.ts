export function formatPayrollNumber(value: number): string {
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseNonNegativeOrFallback(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export function normalizeNumericInput(value: string): string {
  if (value === "") return "";
  return value.replace(/^0+(?=\d)/, "");
}

export function toClockHours(value: number): string {
  const totalMinutes = Math.max(0, Math.round(value * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function toShortDateLabel(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return `${parsed.getMonth() + 1}/${parsed.getDate()}`;
}

export function toWeekLabel(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${parsed.getDate()}/${days[parsed.getDay()]}`;
}

export function extractSiteName(rawSite: string): string {
  const cleaned = rawSite.trim();
  if (!cleaned) return "";

  const normalized = cleaned
    .replace(/\s+\d{4}\s*TO\s*\d{4}\b/gi, "")
    .replace(/\s+\d{4}-\d{2}-\d{2}\s*to\s*\d{4}-\d{2}-\d{2}\b/gi, "")
    .replace(/\s+\d+\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!normalized || normalized === "-" || normalized.toLowerCase() === "n/a") {
    return "";
  }

  return normalized;
}

export function extractPayrollPeriod(value: string): { start: string; end: string } | null {
  const normalized = value.trim();
  if (!normalized) return null;

  const compactRange = normalized.match(/(\d{4})\s*TO\s*(\d{4})/i);
  if (compactRange) {
    return { start: compactRange[1], end: compactRange[2] };
  }

  const isoRange = normalized.match(
    /(\d{4})-(\d{2})-(\d{2})\s*to\s*(\d{4})-(\d{2})-(\d{2})/i,
  );
  if (isoRange) {
    return {
      start: `${isoRange[2]}${isoRange[3]}`,
      end: `${isoRange[5]}${isoRange[6]}`,
    };
  }

  return null;
}

export function formatCompactPayrollPeriodLabel(start: string, end: string): string {
  const startMonth = Number.parseInt(start.slice(0, 2), 10);
  const startDay = Number.parseInt(start.slice(2, 4), 10);
  const endMonth = Number.parseInt(end.slice(0, 2), 10);
  const endDay = Number.parseInt(end.slice(2, 4), 10);

  const isValidDate = (month: number, day: number) =>
    Number.isFinite(month) &&
    Number.isFinite(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31;

  if (!isValidDate(startMonth, startDay) || !isValidDate(endMonth, endDay)) {
    return `${start} to ${end}`;
  }

  const year = 2026;
  const startDate = new Date(year, startMonth - 1, startDay);
  const endDate = new Date(year, endMonth - 1, endDay);
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  });

  return `${formatter.format(startDate)} to ${formatter.format(endDate)}`;
}

export function formatPayrollPeriodFromText(value: string): string | null {
  const parsed = extractPayrollPeriod(value);
  if (!parsed) return null;
  return formatCompactPayrollPeriodLabel(parsed.start, parsed.end);
}

