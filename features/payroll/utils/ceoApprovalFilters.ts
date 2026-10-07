export type CeoApprovalStatus = "all" | "pending" | "approved" | "rejected";
export type CeoApprovalRow = {
  status: "pending" | "approved" | "rejected";
  employee_name: string | null; site_name: string | null; period_label: string | null;
  notes?: string | null; reason?: string | null;
  payroll_runs?: { site_name: string; period_label: string } | { site_name: string; period_label: string }[] | null;
};

export function selectCeoApprovalRows<T extends CeoApprovalRow>(rows: T[], query: string, status: CeoApprovalStatus) {
  const search = query.trim().toLowerCase();
  return rows.filter((row) => {
    const run = Array.isArray(row.payroll_runs) ? row.payroll_runs[0] : row.payroll_runs;
    return (status === "all" || row.status === status)
      && [row.employee_name, run?.site_name || row.site_name, run?.period_label || row.period_label, row.reason, row.notes].filter(Boolean).join(" ").toLowerCase().includes(search);
  });
}
