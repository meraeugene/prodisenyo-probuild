import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import type { PayrollDashboardData } from "@/features/payroll-dashboard/types";

export default function PayrollWorkspaceSummaryCards({ data }: { data: PayrollDashboardData }) {
  const cards = [
    {
      label: "Active Payroll Drafts",
      value: data.workspaceRuns.filter((run) => run.status === "draft").length.toLocaleString("en-PH"),
      tone: "bg-sky-50 text-sky-700",
    },
    {
      label: "Total Approved Payroll",
      value: data.workspaceRuns.filter((run) => run.status === "approved").length.toLocaleString("en-PH"),
      tone: "bg-emerald-50 text-emerald-700",
    },
  ];

  return <WorkspaceSummaryCards ariaLabel="Payroll workspace summary" cards={cards} className="md:grid-cols-2" />;
}
