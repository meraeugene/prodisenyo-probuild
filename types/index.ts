export interface Employee {
  id: number;
  name: string;
  // dept: string;
  days: number;
  regularHours: number;
  otHours: number;
  customRateDay: number | null;
  customRateHour: number | null;
}

export type LogType = "IN" | "OUT";
export type LogSource = "Time1" | "Time2" | "OT";
export type BiometricMatchStatus = "MATCHED" | "NEEDS_REVIEW" | "UNMATCHED";
export type BiometricMatchSource = "EXACT_NAME" | "EXISTING_ALIAS" | "REFERENCE_PDF" | "MANUAL" | "NORMALIZED_MATCH";

export interface AttendanceRecord {
  id?: string;
  employeeId?: string | null;
  date: string;
  employee: string;
  role?: string;
  rawBiometricName?: string;
  normalizedBiometricName?: string;
  matchStatus?: BiometricMatchStatus;
  matchSource?: BiometricMatchSource | null;
  logTime: string;
  nextDay?: boolean;
  type: LogType;
  site: string;
  source: LogSource;
}

export interface EmployeeCalculated extends Employee {
  rateDay: number;
  rateHour: number;
  dayPay: number;
  hourPay: number;
  otPay: number;
  grossPay: number;
}

export interface PayrollConfig {
  defaultRateDay: number;
  defaultRateHour: number;
  otMultiplier: number;
  periodLabel: string;
}

export interface PayrollSummary {
  totalEmployees: number;
  totalDays: number;
  totalHours: number;
  totalGross: number;
}

export type Step = 1 | 2 | 3 | 4;
export type ThemeMode = "prodisenyo";
export interface UploadedFileItem {
  name: string;
  size: number;
  lastModified: number;
  file?: File | null;
  persisted?: boolean;
}

export type Step2View = "daily" | "detailed";
export type Step2Sort = "date-asc" | "date-desc" | "name-asc" | "name-desc";

export interface DailyLogRow {
  date: string;
  employee: string;
  role?: string;
  employeeId?: string | null;
  rawBiometricNames?: string[];
  matchStatus?: BiometricMatchStatus;
  matchSource?: BiometricMatchSource | null;
  time1In: string;
  time1Out: string;
  time2In: string;
  time2Out: string;
  otIn: string;
  otOut: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  hours: number;
  site: string;
  sitePath?: string[];
  timeInSite?: string | null;
  timeOutSite?: string | null;
  time1InSite?: string | null;
  time1OutSite?: string | null;
  time2InSite?: string | null;
  time2OutSite?: string | null;
  otInSite?: string | null;
  otOutSite?: string | null;
}
