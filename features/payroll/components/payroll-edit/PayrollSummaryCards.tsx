import { formatPeso } from "@/features/payroll/utils/payrollEditModalHelpers";
import { formatPayrollNumber } from "@/features/payroll/utils/payrollFormatters";

interface PayrollSummaryCardsProps {
  attendanceDays: number;
  daysWorked: number;
  actualWorkedHours: number;
  regularWorkedHours: number;
  overtimeHours: number;
  adjustedTotalPay: number;
}

export function PayrollSummaryCards(props: PayrollSummaryCardsProps) {
  const cards = [
    {
      label: "Attendance",
      value: String(props.attendanceDays),
      suffix: "days",
    },
    {
      label: "Days Worked",
      value: String(props.daysWorked),
      suffix: "days",
    },
    {
      label: "Actual Hours",
      value: formatPayrollNumber(props.actualWorkedHours),
      suffix: "hrs",
    },
    {
      label: "Regular Hours",
      value: formatPayrollNumber(props.regularWorkedHours),
      suffix: "hrs",
    },
    {
      label: "OT Hours",
      value: formatPayrollNumber(props.overtimeHours),
      suffix: "hrs",
      accent: props.overtimeHours > 0,
    },
    {
      label: "Adjusted Pay",
      value: formatPeso(props.adjustedTotalPay),
      suffix: "total",
      strong: true,
    },
  ];

  return (
    <section
      aria-label="Payroll totals"
      className="grid shrink-0 grid-cols-2 gap-2 border-b border-slate-200 bg-white px-3 py-2.5 sm:grid-cols-3 sm:px-4 xl:grid-cols-6"
    >
      {cards.map((card) => {
        return (
          <div
            key={card.label}
            className={`flex min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
              card.strong
                ? "border-teal-200 bg-teal-50/70"
                : card.accent
                  ? "border-amber-200 bg-amber-50/60"
                  : "border-slate-200 bg-white"
            }`}
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-normal text-slate-500">
                {card.label}
              </p>
              <p
                className={`truncate tabular-nums font-medium leading-5 ${
                  card.strong ? "text-base text-teal-700" : "text-base text-slate-950"
                }`}
              >
                {card.value}{" "}
                <span className="font-sans text-xs font-normal text-slate-400">
                  {card.suffix}
                </span>
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
