"use client";

import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import type { PayrollRunRow } from "../types";
import { formatPayrollReportPeso } from "../utils/payrollReportHelpers";


export default function PayrollApprovalSummary({ reports }: { reports: PayrollRunRow[] }) {
  const pending = reports.filter((report) => report.status === "submitted");
  const approved = reports.filter((report) => report.status === "approved");
  const pendingValue = pending.reduce((sum, report) => sum + Number(report.net_total || 0), 0);
  const sites = new Set(reports.map((report) => report.site_name).filter(Boolean));
  const entries = [
    { label: "Pending Payrolls", value: pending.length, note: "Awaiting CEO review" },
    { label: "Pending Value", value: formatPayrollReportPeso(pendingValue), note: "Net payroll for review" },
    { label: "Approved Payrolls", value: approved.length, note: "Approved payroll runs" },
    { label: "Project Sites", value: sites.size, note: "With payroll records" },
  ];

  return <WorkspaceSummaryCards ariaLabel="Payroll approval summary" cards={entries.map(({ label, value, note }) => ({ label, value, hint: note }))} />;
}
