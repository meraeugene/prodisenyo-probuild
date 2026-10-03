import { ArrowUp, RefreshCw } from "lucide-react";
import { formatPayrollNumber } from "@/features/payroll/utils/payrollFormatters";

const PESO_SIGN = "\u20B1";

export default function DashboardHeroSection({
  totalPayroll,
  reportCount,
  isRefreshing,
  isTrendLoading,
  onSync,
}: {
  totalPayroll: number;
  reportCount: number;
  isRefreshing: boolean;
  isTrendLoading: boolean;
  onSync: () => void | Promise<void>;
}) {
  return (
    <section className="mb-5 rounded-[16px] workspace-surface bg-white p-5 text-[#1d1d1f]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium text-[#53736f]">
            Overall Approved Payroll
          </p>
          <div className="mt-3 flex items-center gap-3">
            <h1 className="whitespace-nowrap text-[30px] font-semibold tracking-[-0.03em] sm:text-[32px]">
              {PESO_SIGN}
              {formatPayrollNumber(totalPayroll)}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf5f3] px-3 py-1 text-xs font-semibold text-[#076d69]">
              Updated <ArrowUp size={12} />
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void onSync()}
          disabled={isRefreshing || isTrendLoading}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-transparent bg-[#076d69] px-4 text-sm font-semibold text-white transition hover:bg-[#065c59] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
    </section>
  );
}
