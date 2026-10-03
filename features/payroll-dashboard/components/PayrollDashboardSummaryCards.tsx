import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import type {
  PayrollDashboardData,
  PayrollDashboardSummary,
} from "@/features/payroll-dashboard/types";
import { formatPayrollCurrency } from "@/features/payroll-dashboard/utils/payrollDashboard";

export default function PayrollDashboardSummaryCards({
  data,
}: {
  data: PayrollDashboardData;
}) {
  const summary: PayrollDashboardSummary = data.summary;
  const cards = [
    {
      label: "Payroll Drafts",
      value: data.workspaceRuns
        .filter((run) => run.status === "draft")
        .length.toLocaleString("en-PH"),
    },
    {
      label: "Payroll to Process",
      value: summary.readyForPayroll.toLocaleString("en-PH"),
    },
    {
      label: "Pending CEO Approval",
      value: summary.awaitingCeo.toLocaleString("en-PH"),
    },
    {
      label: "Approved Payroll Expenses",
      value: formatPayrollCurrency(summary.approvedNetPayroll),
    },
  ];

  return <WorkspaceSummaryCards ariaLabel="Payroll summary" cards={cards} className="xl:grid-cols-4" />;
}
