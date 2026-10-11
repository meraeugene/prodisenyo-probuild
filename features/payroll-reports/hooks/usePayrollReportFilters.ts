import { useMemo, useState } from "react";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import type { PayrollRunRow } from "../types";
import { formatPayrollReportPeriodLabel } from "../utils/payrollReportHelpers";
import { selectPayrollReports } from "../utils/payrollReportSelectors";

export function usePayrollReportFilters(reports: PayrollRunRow[]) {
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const [site, setSite] = useState("all");
  const [sort, setSort] = useState("latest");
  const periods = useMemo(() => [...new Set(reports.map(formatPayrollReportPeriodLabel))], [reports]);
  const sites = useMemo(() => [...new Set(reports.map(report => report.site_name).filter(Boolean))].sort(), [reports]);
  const visibleReports = useMemo(() => selectPayrollReports(reports, { status, query, period, site, sort }), [reports, status, query, period, site, sort]);
  const pagination = useTablePagination(visibleReports, JSON.stringify([status, query, period, site, sort]));
  const tabs = [["all", "All Payroll Runs"], ["submitted", "Pending Review"], ["approved", "Approved"], ["rejected", "Returned"]]
    .map(([value, label]) => ({ value, label, count: value === "all" ? reports.length : reports.filter(report => report.status === value).length }));
  return { status, setStatus, query, setQuery, period, setPeriod, site, setSite, sort, setSort, periods, sites, tabs, visibleReports, pagination,
    hasFilters: !!query || status !== "all" || period !== "all" || site !== "all" || sort !== "latest",
    reset: () => { setStatus("all"); setQuery(""); setPeriod("all"); setSite("all"); setSort("latest"); },
  };
}
