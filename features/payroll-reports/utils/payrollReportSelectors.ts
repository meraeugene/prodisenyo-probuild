import type { PayrollRunRow } from "../types";
import { formatPayrollReportPeriodLabel } from "./payrollReportHelpers";

export function selectPayrollReports(reports: PayrollRunRow[], filters: {
  status: string; query: string; period: string; site: string; sort: string;
}) {
  const term = filters.query.trim().toLocaleLowerCase();
  return reports.filter(report =>
    (filters.status === "all" || report.status === filters.status) &&
    (filters.period === "all" || formatPayrollReportPeriodLabel(report) === filters.period) &&
    (filters.site === "all" || report.site_name === filters.site) &&
    (!term || report.site_name.toLocaleLowerCase().includes(term) || formatPayrollReportPeriodLabel(report).toLocaleLowerCase().includes(term)),
  ).sort((left, right) => filters.sort === "value"
    ? Number(right.net_total) - Number(left.net_total)
    : Date.parse(right.submitted_at ?? right.created_at) - Date.parse(left.submitted_at ?? left.created_at));
}
