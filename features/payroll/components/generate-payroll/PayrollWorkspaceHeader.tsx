import { CalendarDays, Calculator, ChevronDown, Loader2, Send } from "lucide-react";
import { formatPayrollPeriodDate } from "@/features/payroll/utils/payrollWorkspace";

interface PayrollWorkspaceHeaderProps {
  generated: boolean;
  canSubmit: boolean;
  savePending: boolean;
  periodStart?: string;
  periodEnd?: string;
  onGenerate: () => void;
  onSubmit: () => void;
}

export default function PayrollWorkspaceHeader({
  generated,
  canSubmit,
  savePending,
  periodStart,
  periodEnd,
  onGenerate,
  onSubmit,
}: PayrollWorkspaceHeaderProps) {
  const periodLabel = periodStart
    ? `${formatPayrollPeriodDate(periodStart)}${periodEnd && periodEnd !== periodStart ? ` – ${formatPayrollPeriodDate(periodEnd)}` : ""}`
    : "Current attendance period";

  return (
    <header className="flex flex-col gap-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
      <div className="min-w-0 max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#08766f]">
          Payroll workspace
        </p>
        <h1 className="mt-1.5 text-[30px] font-bold leading-tight tracking-[-0.04em] text-[#09223f] sm:text-[34px]">
          Generate Payroll
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#667a93]">
          Review attendance, manage paid holidays and rates, then submit the payroll record for CEO review.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end 2xl:w-auto">
        <div className="min-w-0 flex-1 sm:min-w-[315px] 2xl:flex-none">
          <p className="mb-1.5 text-[11px] font-semibold text-[#132238]">Payroll Period</p>
          <div className="flex h-12 items-center gap-3 rounded-[9px] border border-[#cfdce2] bg-white px-4 text-sm font-semibold text-[#21334b] shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <CalendarDays size={17} className="shrink-0 text-[#496076]" />
            <span className="min-w-0 flex-1 truncate">{periodLabel}</span>
            <ChevronDown size={16} className="shrink-0 text-[#64788c]" />
          </div>
        </div>

        <button
          type="button"
          onClick={generated ? onSubmit : onGenerate}
          disabled={savePending || (generated && !canSubmit)}
          className="inline-flex h-12 min-w-[190px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[9px] bg-[#08766f] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(8,118,111,0.18)] transition hover:bg-[#066861] focus:outline-none focus:ring-4 focus:ring-[#0f9b91]/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savePending ? (
            <Loader2 size={17} className="animate-spin" />
          ) : generated ? (
            <Send size={17} />
          ) : (
            <Calculator size={17} />
          )}
          {savePending ? "Submitting..." : generated ? "Submit Payroll Report" : "Generate Payroll Preview"}
        </button>
      </div>
    </header>
  );
}
