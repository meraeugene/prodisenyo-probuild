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
    <section className="mb-5 rounded-[16px] bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] p-6 text-white shadow-[0_18px_36px_rgba(22,101,52,0.18)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium text-white/65">
            Overall Approved Payroll
          </p>
          <div className="mt-3 flex items-center gap-3">
            <h1 className="text-[40px] font-semibold tracking-[-0.03em]">
              {PESO_SIGN} {formatPayrollNumber(totalPayroll)}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[rgb(var(--theme-chart-5))]">
              Synced <ArrowUp size={12} />
            </span>
          </div>
          <p className="mt-3 text-sm text-white/70">
            {`Across ${reportCount.toLocaleString("en-PH")} approved report${
              reportCount === 1 ? "" : "s"
            }`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void onSync()}
          disabled={isRefreshing || isTrendLoading}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-[rgb(var(--theme-chart-5))] px-4 text-sm font-semibold text-[rgb(var(--apple-black))] transition hover:bg-[rgb(var(--apple-silver))] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={isRefreshing ? "animate-spin" : ""}
          />
          Sync
        </button>
      </div>
    </section>
  );
}
