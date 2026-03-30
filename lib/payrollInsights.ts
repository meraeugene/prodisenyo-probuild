import type { AttendanceRecordInput, PayrollRow } from "@/lib/payrollEngine";

export interface PayrollInsightsKpi {
  totalPayroll: number;
  employeesPaid: number;
  totalOvertimeCost: number;
  averageSalary: number;
}

export interface PayrollCostTrendPoint {
  period: string;
  regular: number;
  overtime: number;
  total: number;
}

export interface PayrollDistributionByProjectPoint {
  name: string;
  value: number;
}

export interface OvertimeByEmployeePoint {
  employeeName: string;
  overtimePay: number;
}

export interface TopPaidEmployeePoint {
  employeeName: string;
  salary: number;
}

export interface PayrollCostPerProjectPoint {
  project: string;
  regularPay: number;
  overtimePay: number;
  allowance: number;
}

export interface PayrollInsightsData {
  kpis: PayrollInsightsKpi;
  payrollCostTrend: PayrollCostTrendPoint[];
  payrollDistributionByProject: PayrollDistributionByProjectPoint[];
  overtimeCostByEmployee: OvertimeByEmployeePoint[];
  topPaidEmployees: TopPaidEmployeePoint[];
  payrollCostPerProject: PayrollCostPerProjectPoint[];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeEmployeeKey(name: string): string {
  return name.trim().toLowerCase();
}

function workerKey(name: string): string {
  return normalizeEmployeeKey(name);
}

function splitSiteNames(value: string): string[] {
  return value
    .split(",")
    .map((site) => site.trim())
    .filter((site) => site.length > 0);
}

function getDailyHoursByWorker(
  attendanceRows: AttendanceRecordInput[],
): Map<string, Map<string, number>> {
  const map = new Map<string, Map<string, number>>();
  for (const row of attendanceRows) {
    const key = workerKey(row.name);
    const daily = map.get(key) ?? new Map<string, number>();
    daily.set(row.date, (daily.get(row.date) ?? 0) + row.hours);
    map.set(key, daily);
  }
  return map;
}

function getSiteHoursByWorker(
  attendanceRows: AttendanceRecordInput[],
): Map<string, Map<string, number>> {
  const map = new Map<string, Map<string, number>>();
  for (const row of attendanceRows) {
    const key = workerKey(row.name);
    const sites = map.get(key) ?? new Map<string, number>();
    sites.set(row.site, (sites.get(row.site) ?? 0) + row.hours);
    map.set(key, sites);
  }
  return map;
}

function buildTrend(
  payrollRows: PayrollRow[],
  workerDailyHours: Map<string, Map<string, number>>,
): PayrollCostTrendPoint[] {
  const perDate = new Map<string, { regular: number; overtime: number }>();

  for (const row of payrollRows) {
    const dailyHours = workerDailyHours.get(workerKey(row.worker));
    if (!dailyHours || dailyHours.size === 0) continue;

    const totalHours = Array.from(dailyHours.values()).reduce(
      (sum, value) => sum + value,
      0,
    );
    if (totalHours <= 0) continue;

    for (const [date, hours] of dailyHours.entries()) {
      const ratio = hours / totalHours;
      const current = perDate.get(date) ?? { regular: 0, overtime: 0 };
      current.regular += row.regularPay * ratio;
      current.overtime += row.overtimePay * ratio;
      perDate.set(date, current);
    }
  }

  return Array.from(perDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dateText, value]) => ({
      period: dateText,
      regular: round2(value.regular),
      overtime: round2(value.overtime),
      total: round2(value.regular + value.overtime),
    }));
}

function buildProjectComposition(
  payrollRows: PayrollRow[],
  workerSiteHours: Map<string, Map<string, number>>,
): PayrollCostPerProjectPoint[] {
  const perProject = new Map<
    string,
    { regularPay: number; overtimePay: number; allowance: number }
  >();

  for (const row of payrollRows) {
    const sites = workerSiteHours.get(workerKey(row.worker));
    if (!sites || sites.size === 0) {
      const fallbackSites = splitSiteNames(row.site || "Unknown Site");
      const ratio = fallbackSites.length > 0 ? 1 / fallbackSites.length : 1;

      fallbackSites.forEach((site) => {
        const current = perProject.get(site) ?? {
          regularPay: 0,
          overtimePay: 0,
          allowance: 0,
        };
        current.regularPay += row.regularPay * ratio;
        current.overtimePay += row.overtimePay * ratio;
        perProject.set(site, current);
      });
      continue;
    }

    const totalHours = Array.from(sites.values()).reduce(
      (sum, value) => sum + value,
      0,
    );
    if (totalHours <= 0) continue;

    for (const [site, hours] of sites.entries()) {
      const ratio = hours / totalHours;
      const current = perProject.get(site) ?? {
        regularPay: 0,
        overtimePay: 0,
        allowance: 0,
      };
      current.regularPay += row.regularPay * ratio;
      current.overtimePay += row.overtimePay * ratio;
      perProject.set(site, current);
    }
  }

  return Array.from(perProject.entries())
    .map(([project, value]) => ({
      project,
      regularPay: round2(value.regularPay),
      overtimePay: round2(value.overtimePay),
      allowance: round2(value.allowance),
    }))
    .sort(
      (a, b) =>
        b.regularPay +
        b.overtimePay +
        b.allowance -
        (a.regularPay + a.overtimePay + a.allowance),
    );
}

function buildEmployeeTotals(payrollRows: PayrollRow[]) {
  const totals = new Map<
    string,
    { employeeName: string; salary: number; overtimePay: number }
  >();

  for (const row of payrollRows) {
    const key = normalizeEmployeeKey(row.worker);
    const current = totals.get(key) ?? {
      employeeName: row.worker,
      salary: 0,
      overtimePay: 0,
    };

    current.salary += row.totalPay;
    current.overtimePay += row.overtimePay;

    if (row.worker.length > current.employeeName.length) {
      current.employeeName = row.worker;
    }

    totals.set(key, current);
  }

  return Array.from(totals.values()).map((employee) => ({
    employeeName: employee.employeeName,
    salary: round2(employee.salary),
    overtimePay: round2(employee.overtimePay),
  }));
}

export function buildPayrollInsightsData(
  payrollRows: PayrollRow[],
  attendanceRows: AttendanceRecordInput[],
): PayrollInsightsData {
  const totalPayroll = payrollRows.reduce((sum, row) => sum + row.totalPay, 0);
  const totalOvertimeCost = payrollRows.reduce(
    (sum, row) => sum + row.overtimePay,
    0,
  );
  const employeeTotals = buildEmployeeTotals(payrollRows);
  const employeesPaid = employeeTotals.length;
  const averageSalary = employeesPaid === 0 ? 0 : totalPayroll / employeesPaid;

  const workerDailyHours = getDailyHoursByWorker(attendanceRows);
  const workerSiteHours = getSiteHoursByWorker(attendanceRows);
  const payrollCostPerProject = buildProjectComposition(payrollRows, workerSiteHours);

  return {
    kpis: {
      totalPayroll: round2(totalPayroll),
      employeesPaid,
      totalOvertimeCost: round2(totalOvertimeCost),
      averageSalary: round2(averageSalary),
    },
    payrollCostTrend: buildTrend(payrollRows, workerDailyHours),
    payrollDistributionByProject: payrollCostPerProject.map((row) => ({
      name: row.project,
      value: round2(row.regularPay + row.overtimePay + row.allowance),
    })),
    overtimeCostByEmployee: employeeTotals
      .filter((employee) => employee.overtimePay > 0)
      .map((employee) => ({
        employeeName: employee.employeeName,
        overtimePay: employee.overtimePay,
      }))
      .sort((a, b) => b.overtimePay - a.overtimePay)
      .slice(0, 10),
    topPaidEmployees: employeeTotals
      .map((employee) => ({
        employeeName: employee.employeeName,
        salary: employee.salary,
      }))
      .sort((a, b) => b.salary - a.salary)
      .slice(0, 10),
    payrollCostPerProject,
  };
}
