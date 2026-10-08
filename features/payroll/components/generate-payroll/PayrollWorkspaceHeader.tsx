import { Calculator, Loader2, Save, Send } from "lucide-react";
import { formatPayrollPeriodDate } from "@/features/payroll/utils/payrollWorkspace";

interface PayrollWorkspaceHeaderProps {
  generated: boolean;
  canSubmit: boolean;
  savePending: boolean;
  periodStart?: string;
  periodEnd?: string;
  onGenerate: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
}

export default function PayrollWorkspaceHeader({
  generated,
  canSubmit,
  savePending,
  periodStart,
  periodEnd,
  onGenerate,
  onSaveDraft,
  onSubmit,
}: PayrollWorkspaceHeaderProps) {
  const periodLabel = periodStart
    ? `${formatPayrollPeriodDate(periodStart)}${periodEnd && periodEnd !== periodStart ? ` – ${formatPayrollPeriodDate(periodEnd)}` : ""}`
    : "Current attendance period";

  return (
    <header className="workspace-page-header flex flex-col gap-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
      <div className="min-w-0 max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#08766f]">
          Payroll workspace
        </p>
        <h1 className="mt-1.5 text-[26px] font-semibold leading-tight tracking-[-0.025em] text-slate-950">
          Generate Payroll
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#667a93]">
          Review attendance, manage paid holidays and rates, then submit the payroll record for CEO review.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end 2xl:w-auto">
        <div className="min-w-0 flex-1 sm:min-w-[315px] 2xl:flex-none">
          <p className="mb-1.5 text-[11px] font-semibold text-[#132238]">Payroll Period</p>
          <div data-payroll-period="true" className="flex h-9 items-center gap-3 rounded-[5px] border border-[#cfdce2] bg-white px-3 text-[13px] font-medium text-[#21334b]">
            <span className="min-w-0 flex-1 truncate">{periodLabel}</span>
          </div>
        </div>

        {generated ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={savePending || !canSubmit}
              className="inline-flex h-9 min-w-[145px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[5px] border border-[#08766f] bg-white px-5 text-[13px] font-medium text-[#08766f] transition hover:bg-[#eff9f7] focus:outline-none focus:ring-4 focus:ring-[#0f9b91]/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savePending ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
              {savePending ? "Saving..." : "Save as Draft"}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={savePending || !canSubmit}
              className="inline-flex h-9 min-w-[190px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[5px] bg-[#08766f] px-6 text-[13px] font-medium text-white transition hover:bg-[#066861] focus:outline-none focus:ring-4 focus:ring-[#0f9b91]/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={17} />
              Submit for CEO Review
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onGenerate}
            disabled={savePending}
            className="inline-flex h-9 min-w-[190px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[5px] bg-[#08766f] px-6 text-[13px] font-medium text-white transition hover:bg-[#066861] focus:outline-none focus:ring-4 focus:ring-[#0f9b91]/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Calculator size={17} />
            Generate Payroll Preview
          </button>
        )}
      </div>
    </header>
  );
}
