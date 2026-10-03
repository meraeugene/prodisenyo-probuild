import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import { formatPeso } from "@/features/payroll/utils/payrollWorkspace";

interface PayrollSummaryCardsProps {
  totalEmployees: number;
  needsReview: number;
  ready: number;
  totalPayroll: number;
}

const cards = [
  { key: "employees", label: "Total Employees", detail: "included in this period" },
  { key: "review", label: "Needs Review", detail: "resolve before submission" },
  { key: "ready", label: "Ready", detail: "verified payroll records" },
  { key: "payroll", label: "Total Payroll", detail: "estimated net total" },
] as const;

export default function PayrollSummaryCards({ totalEmployees, needsReview, ready, totalPayroll }: PayrollSummaryCardsProps) {
  const values = {
    employees: totalEmployees.toLocaleString("en-PH"),
    review: needsReview.toLocaleString("en-PH"),
    ready: ready.toLocaleString("en-PH"),
    payroll: formatPeso(totalPayroll),
  };

  return <WorkspaceSummaryCards ariaLabel="Payroll preparation summary" className="xl:grid-cols-4" cards={cards.map(({ key, label, detail }) => ({ label, value: values[key], hint: detail }))} />;
}
