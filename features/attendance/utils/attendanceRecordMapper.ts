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
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
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
      logTime: row.log_time,
      type: row.log_type,
      source: row.log_source,
      site: row.site_name,
    };
  });
}
