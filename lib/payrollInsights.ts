import type { AttendanceRecordInput, PayrollRow } from "@/lib/payrollEngine";

export interface PayrollInsightsKpi {
  totalPayroll: number;
  employeesPaid: number;
  totalOvertimeCost: number;
  averageSalary: number;
}

export interface PayrollTrendPoint {
  period: string;
  regular: number;
  overtime: number;
  total: number;
}

export interface PayrollDistributionPoint {
  name: string;
  value: number;
}

export interface PayrollOvertimeEmployeePoint {
  employeeName: string;
  overtimePay: number;
}

export interface PayrollTopPaidPoint {
  employeeName: string;
  salary: number;
}

export interface PayrollProjectCostPoint {
  project: string;
  regularPay: number;
  overtimePay: number;
  allowance: number;
}

export interface PayrollInsightsData {
  kpis: PayrollInsightsKpi;
  payrollCostTrend: PayrollTrendPoint[];
  payrollDistributionByProject: PayrollDistributionPoint[];
  overtimeCostByEmployee: PayrollOvertimeEmployeePoint[];
  topPaidEmployees: PayrollTopPaidPoint[];
  payrollCostPerProject: PayrollProjectCostPoint[];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function identityKey(role: string, name: string): string {
  return `${role}|||${name}`;
}

function parseIsoDate(dateText: string): Date | null {
  const parsed = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function buildWorkerSiteHours(
  attendance: AttendanceRecordInput[],
): Map<string, Map<string, number>> {
  const map = new Map<string, Map<string, number>>();

  for (const row of attendance) {
    const key = identityKey(row.role, row.name);
    const siteMap = map.get(key) ?? new Map<string, number>();
    siteMap.set(row.site, (siteMap.get(row.site) ?? 0) + row.hours);
    map.set(key, siteMap);
  }

  return map;
}

function buildWorkerDateHours(
  attendance: AttendanceRecordInput[],
): Map<string, Map<string, number>> {
  const map = new Map<string, Map<string, number>>();

  for (const row of attendance) {
    const key = identityKey(row.role, row.name);
    const dateMap = map.get(key) ?? new Map<string, number>();
    dateMap.set(row.date, (dateMap.get(row.date) ?? 0) + row.hours);
    map.set(key, dateMap);
  }

  return map;
}

function buildProjectCosts(
  payrollRows: PayrollRow[],
  workerSiteHours: Map<string, Map<string, number>>,
): PayrollProjectCostPoint[] {
  const projectMap = new Map<
    string,
    { regularPay: number; overtimePay: number; allowance: number }
  >();

  for (const row of payrollRows) {
    const siteMap = workerSiteHours.get(row.id);
    if (!siteMap || siteMap.size === 0) {
      const project = row.site || "Unknown Site";
      const current = projectMap.get(project) ?? {
        regularPay: 0,
        overtimePay: 0,
        allowance: 0,
      };
      current.regularPay += row.regularPay;
      current.overtimePay += row.overtimePay;
      projectMap.set(project, current);
      continue;
    }

    const totalHours = Array.from(siteMap.values()).reduce(
      (sum, value) => sum + value,
      0,
    );
    if (totalHours <= 0) continue;

    for (const [project, hours] of siteMap) {
      const ratio = hours / totalHours;
      const current = projectMap.get(project) ?? {
        regularPay: 0,
        overtimePay: 0,
        allowance: 0,
      };
      current.regularPay += row.regularPay * ratio;
      current.overtimePay += row.overtimePay * ratio;
      projectMap.set(project, current);
    }
  }

  return Array.from(projectMap.entries())
    .map(([project, values]) => ({
      project,
      regularPay: round2(values.regularPay),
      overtimePay: round2(values.overtimePay),
      allowance: round2(values.allowance),
    }))
    .sort(
      (a, b) =>
        b.regularPay +
        b.overtimePay +
        b.allowance -
        (a.regularPay + a.overtimePay + a.allowance),
    );
}

function buildTrend(
  payrollRows: PayrollRow[],
  workerDateHours: Map<string, Map<string, number>>,
): PayrollTrendPoint[] {
  const daily = new Map<string, { regular: number; overtime: number }>();

  for (const row of payrollRows) {
    const dateMap = workerDateHours.get(row.id);
    if (!dateMap || dateMap.size === 0) continue;

    const totalHours = Array.from(dateMap.values()).reduce(
      (sum, value) => sum + value,
      0,
    );
    if (totalHours <= 0) continue;

    for (const [dateText, hours] of dateMap) {
      const ratio = hours / totalHours;
      const current = daily.get(dateText) ?? { regular: 0, overtime: 0 };
      current.regular += row.regularPay * ratio;
      current.overtime += row.overtimePay * ratio;
      daily.set(dateText, current);
    }
  }

  const sortedDates = Array.from(daily.keys()).sort((a, b) => a.localeCompare(b));
  if (sortedDates.length === 0) return [];

  const firstDate = parseIsoDate(sortedDates[0]);
  if (!firstDate) return [];

  const weekMap = new Map<number, { regular: number; overtime: number }>();
  const dayMs = 24 * 60 * 60 * 1000;

  for (const dateText of sortedDates) {
    const currentDate = parseIsoDate(dateText);
    if (!currentDate) continue;
    const diffDays = Math.floor((currentDate.getTime() - firstDate.getTime()) / dayMs);
    const weekNo = Math.floor(diffDays / 7) + 1;
    const currentWeek = weekMap.get(weekNo) ?? { regular: 0, overtime: 0 };
    const dailyValue = daily.get(dateText)!;
    currentWeek.regular += dailyValue.regular;
    currentWeek.overtime += dailyValue.overtime;
    weekMap.set(weekNo, currentWeek);
  }

  return Array.from(weekMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([weekNo, value]) => ({
      period: `Week ${weekNo}`,
      regular: round2(value.regular),
      overtime: round2(value.overtime),
      total: round2(value.regular + value.overtime),
    }));
}

export function buildPayrollInsights(
  payrollRows: PayrollRow[],
  attendance: AttendanceRecordInput[],
): PayrollInsightsData {
  const totalPayroll = payrollRows.reduce((sum, row) => sum + row.totalPay, 0);
  const totalOvertimeCost = payrollRows.reduce((sum, row) => sum + row.overtimePay, 0);
  const employeesPaid = payrollRows.length;
  const averageSalary = employeesPaid > 0 ? totalPayroll / employeesPaid : 0;

  const workerSiteHours = buildWorkerSiteHours(attendance);
  const workerDateHours = buildWorkerDateHours(attendance);
  const payrollCostPerProject = buildProjectCosts(payrollRows, workerSiteHours);
  const payrollCostTrend = buildTrend(payrollRows, workerDateHours);

  const payrollDistributionByProject = payrollCostPerProject.map((project) => ({
    name: project.project,
    value: round2(project.regularPay + project.overtimePay + project.allowance),
  }));

  const overtimeCostByEmployee = payrollRows
    .map((row) => ({
      employeeName: row.worker,
      overtimePay: round2(row.overtimePay),
    }))
    .filter((row) => row.overtimePay > 0)
    .sort((a, b) => b.overtimePay - a.overtimePay)
    .slice(0, 12);

  const topPaidEmployees = payrollRows
    .map((row) => ({
      employeeName: row.worker,
      salary: round2(row.totalPay),
    }))
    .sort((a, b) => b.salary - a.salary)
    .slice(0, 10);

  return {
    kpis: {
      totalPayroll: round2(totalPayroll),
      employeesPaid,
      totalOvertimeCost: round2(totalOvertimeCost),
      averageSalary: round2(averageSalary),
    },
    payrollCostTrend,
    payrollDistributionByProject,
    overtimeCostByEmployee,
    topPaidEmployees,
    payrollCostPerProject,
  };
}
