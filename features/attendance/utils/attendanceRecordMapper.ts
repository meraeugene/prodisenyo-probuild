import type { AttendanceRecord } from "@/types";
import type { Database } from "@/types/database";

type AttendanceRecordRow = Database["public"]["Tables"]["attendance_records"]["Row"];

export type CanonicalAttendanceRecordRow = AttendanceRecordRow & {
  employee?: {
    full_name: string;
    default_role_code: string | null;
  } | null;
};

const DISPLAY_SUFFIXES: Record<string, string> = {
  jr: "Jr",
  sr: "Sr",
  ii: "II",
  iii: "III",
  iv: "IV",
};

export function formatBiometricDisplayName(value: string): string {
  const displayTokens = value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ");

  // Job prefixes belong to the biometric device identity, not the person's
  // visible name. The untouched raw value remains available for auditing.
  if (displayTokens[0]?.toLowerCase() === "elec" && displayTokens.length > 1) {
    displayTokens.shift();
  }

  return displayTokens
    .map((token) => {
      const lower = token.toLowerCase();
      return DISPLAY_SUFFIXES[lower] ??
        `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
    })
    .join(" ");
}

export function mapCanonicalAttendanceRecords(
  rows: CanonicalAttendanceRecordRow[],
): AttendanceRecord[] {
  return rows.map((row) => {
    const canonicalEmployee = row.employee_id ? row.employee : null;
    return {
      id: row.id,
      employeeId: row.employee_id,
      date: row.log_date,
      employee:
        canonicalEmployee?.full_name ?? formatBiometricDisplayName(row.employee_name),
      role: canonicalEmployee?.default_role_code ?? undefined,
      rawBiometricName: row.raw_biometric_name ?? row.employee_name,
      normalizedBiometricName: row.normalized_biometric_name,
      matchStatus: row.match_status,
      matchSource: row.match_source,
      logTime: row.is_next_day
        ? `${row.log_time.slice(0, 5)}+`
        : row.log_time,
      nextDay: row.is_next_day,
      type: row.log_type,
      source: row.log_source,
      site: row.site_name,
    };
  });
}
