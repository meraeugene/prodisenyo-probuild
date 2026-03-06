import type {
  Employee,
  EmployeeCalculated,
  PayrollConfig,
  PayrollSummary,
} from "@/app/types";

export function calculateEmployee(
  emp: Employee,
  config: PayrollConfig,
): EmployeeCalculated {
  const rateDay = emp.customRateDay ?? config.defaultRateDay;
  const rateHour = emp.customRateHour ?? config.defaultRateHour;
  const dayPay = rateDay * emp.days;
  const hourPay = rateHour * emp.regularHours;
  const otPay = rateHour * config.otMultiplier * emp.otHours;
  const grossPay = dayPay + otPay;

  return { ...emp, rateDay, rateHour, dayPay, hourPay, otPay, grossPay };
}

export function calculateAll(
  employees: Employee[],
  config: PayrollConfig,
): EmployeeCalculated[] {
  return employees.map((e) => calculateEmployee(e, config));
}

export function getSummary(calculated: EmployeeCalculated[]): PayrollSummary {
  return {
    totalEmployees: calculated.length,
    totalDays: calculated.reduce((s, e) => s + e.days, 0),
    totalHours: calculated.reduce((s, e) => s + e.regularHours + e.otHours, 0),
    totalGross: calculated.reduce((s, e) => s + e.grossPay, 0),
  };
}

export function formatPHP(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function capitalize(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function exportToExcel(
  calculated: EmployeeCalculated[],
  period: string,
): Promise<void> {
  const XLSX = await import("xlsx");
  const headers = [
    "#",
    "Employee",
    "Days",
    "Reg. Hours",
    "OT Hours",
    "Rate/Day",
    "Rate/Hour",
    "Day Pay",
    "OT Pay",
    "Gross Pay",
  ];
  const rows = calculated.map((e, i) => [
    i + 1,
    capitalize(e.name),
    Number(e.days.toFixed(1)),
    Number(e.regularHours.toFixed(1)),
    Number(e.otHours.toFixed(1)),
    Number(e.rateDay.toFixed(2)),
    Number(e.rateHour.toFixed(2)),
    Number(e.dayPay.toFixed(2)),
    Number(e.otPay.toFixed(2)),
    Number(e.grossPay.toFixed(2)),
  ]);
  const sheetRows = [headers, ...rows];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetRows);
  ws["!cols"] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Payroll");
  XLSX.writeFile(wb, `payroll_${period.replace(/\s/g, "_")}.xlsx`);
}
