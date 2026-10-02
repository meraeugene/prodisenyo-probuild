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

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ key, label, detail }) => (
        <article key={key} className="flex min-h-[108px] items-center gap-4 rounded-[10px] border border-[#d8e8e8] bg-white px-5 py-4 shadow-[0_4px_14px_rgba(26,58,71,0.035)]">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#61758e]">{label}</p>
            <p className="mt-0.5 truncate text-[24px] font-bold leading-tight tracking-[-0.035em] text-[#0b213e]">{values[key]}</p>
            <p className="mt-1 truncate text-[11px] text-[#8290a3]">{detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
