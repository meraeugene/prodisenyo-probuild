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

export function exportToCSV(
  calculated: EmployeeCalculated[],
  period: string,
): void {
  const headers = [
    "#",
    "Name",
    "Department",
    "Days Present",
    "Regular Hours",
    "OT Hours",
    "Rate/Day (₱)",
    "Rate/Hour (₱)",
    "Day Pay (₱)",
    "OT Pay (₱)",
    "Gross Pay (₱)",
  ];
  const rows = calculated.map((e, i) => [
    i + 1,
    capitalize(e.name),
    // e.dept,
    e.days,
    e.regularHours,
    e.otHours,
    e.rateDay.toFixed(2),
    e.rateHour.toFixed(2),
    e.dayPay.toFixed(2),
    e.otPay.toFixed(2),
    e.grossPay.toFixed(2),
  ]);

  const csv = [
    [`PayCalc Payroll Report — ${period}`],
    [],
    headers,
    ...rows,
    [],
    [
      "TOTAL",
      "",
      "",
      calculated.reduce((s, e) => s + e.days, 0),
      calculated.reduce((s, e) => s + e.regularHours, 0),
      calculated.reduce((s, e) => s + e.otHours, 0),
      "",
      "",
      "",
      "",
      calculated.reduce((s, e) => s + e.grossPay, 0).toFixed(2),
    ],
  ]
    .map((r) => r.map((c) => `"${c}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payroll_${period.replace(/\s/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
