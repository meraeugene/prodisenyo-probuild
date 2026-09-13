import type { PayrollRunRow } from "../types";

export function buildPayrollApprovalAnalytics(
  reports: PayrollRunRow[],
  months = 6,
  now = new Date(),
) {
  const trend = Array.from({ length: months }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - months + index + 1, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const rows = reports.filter((report) =>
      (report.submitted_at ?? report.created_at).startsWith(key),
    );
    return {
      month: date.toLocaleDateString("en", { month: "short", year: "numeric" }),
      gross: rows.reduce((sum, report) => sum + Number(report.gross_total || 0), 0),
      net: rows.reduce((sum, report) => sum + Number(report.net_total || 0), 0),
    };
  });
  const statuses = [
    { name: "Approved", value: reports.filter((report) => report.status === "approved").length, color: "#159447" },
    { name: "Pending Review", value: reports.filter((report) => report.status === "submitted").length, color: "#1673ea" },
    { name: "Returned", value: reports.filter((report) => report.status === "rejected").length, color: "#f5ad19" },
  ];
  const sites = new Map<string, number>();
  reports.forEach((report) => {
    const name = report.site_name?.trim() || "Unknown site";
    sites.set(name, (sites.get(name) ?? 0) + Number(report.net_total || 0));
  });

  return {
    trend,
    statuses,
    sites: [...sites].map(([name, value]) => ({ name, value })).sort((left, right) => right.value - left.value),
    totalGross: reports.reduce((sum, report) => sum + Number(report.gross_total || 0), 0),
    totalNet: reports.reduce((sum, report) => sum + Number(report.net_total || 0), 0),
  };
}
