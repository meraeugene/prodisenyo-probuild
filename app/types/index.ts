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

export type Step = 1 | 2 | 3;
