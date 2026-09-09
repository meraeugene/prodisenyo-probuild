"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PayrollInsightsDashboard from "@/components/PayrollInsightsDashboard";
import { useHistoricalDashboardData } from "@/features/dashboard/hooks/useHistoricalDashboardData";
import { PayrollAnalyticsLoadingState } from "./PayrollAnalyticsLoadingState";
import PayrollAnalyticsHero from "./PayrollAnalyticsHero";

export default function PayrollAnalyticsPageClient() {
  const searchParams = useSearchParams();
  const { data, loading, error, selectedPeriodKey, setSelectedPeriodKey } =
    useHistoricalDashboardData({
      includeEmployees: true,
      includeAttendance: true,
      includePayrollItems: true,
      includePayrollDailyTotals: true,
    });
  const runIdFromQuery = searchParams.get("runId");
  const payrollRows = data?.payrollRows ?? [];
  const attendanceRows = data?.payrollAttendanceInputs ?? [];
  const dailyPaidPoints = data?.payrollDailyPaidPoints ?? [];
  const periodOptions = data?.periodOptions ?? [];
  const hasPayrollAnalyticsData = payrollRows.length > 0;
  const selectedPeriodLabel = periodOptions.find(
    (option) => option.key === selectedPeriodKey,
  );

  useEffect(() => {
    if (!runIdFromQuery) return;
    if (runIdFromQuery === selectedPeriodKey) return;
    setSelectedPeriodKey(runIdFromQuery);
  }, [runIdFromQuery, selectedPeriodKey, setSelectedPeriodKey]);

  return (
    <div className="min-h-full space-y-4 bg-white p-4 sm:p-6 lg:p-8">
      <PayrollAnalyticsHero
        periodLabel={selectedPeriodLabel ? `${selectedPeriodLabel.label} · ${selectedPeriodLabel.siteName}` : undefined}
      />
      {periodOptions.length > 0 ? (
        <section className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_-25px_rgba(15,23,42,.25)] sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm font-bold text-slate-950">Payroll period</p><p className="mt-1 text-xs text-slate-500">Choose a saved run to update every chart below.</p></div>
            <select
              aria-label="Payroll period"
              value={selectedPeriodKey ?? ""}
              onChange={(event) =>
                setSelectedPeriodKey(event.target.value || null)
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition hover:border-teal-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 sm:w-auto sm:min-w-[320px]"
            >
              {periodOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label} - {option.siteName}
                </option>
              ))}
            </select>
          </div>
        </section>
      ) : null}
      {loading && !data && !error ? (
        <PayrollAnalyticsLoadingState />
      ) : hasPayrollAnalyticsData ? (
        <PayrollInsightsDashboard
          payrollRows={payrollRows}
          attendanceRows={attendanceRows}
          dailyPaidPoints={dailyPaidPoints}
        />
      ) : error ? (
        <section className="rounded-[14px] border border-red-100 bg-red-50 p-6 shadow-[0_10px_30px_rgba(7,109,105,0.07)]">
          <p className="text-sm text-red-700">{error}</p>
        </section>
      ) : (
        <section className="rounded-[14px] border border-apple-mist bg-white p-6 shadow-[0_10px_30px_rgba(7,109,105,0.07)]">
          <p className="text-sm text-apple-smoke">
            No saved payroll periods yet.
          </p>
        </section>
      )}
    </div>
  );
}
