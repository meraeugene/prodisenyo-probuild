"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import AttendanceAnalyticsSection from "@/features/analytics/components/AttendanceAnalyticsSection";
import { useHistoricalDashboardData } from "@/features/dashboard/hooks/useHistoricalDashboardData";

function SkeletonBlock({
  className,
}: {
  className: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[linear-gradient(90deg,rgba(232,242,236,0.95),rgba(244,249,246,1),rgba(232,242,236,0.95))] bg-[length:200%_100%] ${className}`}
    />
  );
}

function AttendanceAnalyticsLoadingState() {
  return (
    <section className="overflow-hidden rounded-[14px] border border-apple-mist bg-white shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
      <div className="border-b border-apple-mist px-4 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
        <SkeletonBlock className="h-3 w-24 rounded-full" />
        <SkeletonBlock className="mt-4 h-8 w-72 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-[26rem] max-w-full" />
      </div>

      <div className="space-y-8 px-4 py-5 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <SkeletonBlock className="h-3 w-40 rounded-full" />
            <div className="rounded-[12px] border border-apple-mist bg-[rgb(var(--apple-snow))] p-4">
              <div className="flex h-[220px] items-end gap-3 sm:h-[250px]">
                <SkeletonBlock className="h-[52%] flex-1 rounded-t-xl rounded-b-md" />
                <SkeletonBlock className="h-[76%] flex-1 rounded-t-xl rounded-b-md" />
                <SkeletonBlock className="h-[64%] flex-1 rounded-t-xl rounded-b-md" />
                <SkeletonBlock className="h-[84%] flex-1 rounded-t-xl rounded-b-md" />
                <SkeletonBlock className="h-[58%] flex-1 rounded-t-xl rounded-b-md" />
                <SkeletonBlock className="h-[72%] flex-1 rounded-t-xl rounded-b-md" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <SkeletonBlock className="h-3 w-40 rounded-full" />
            <div className="rounded-[12px] border border-apple-mist bg-[rgb(var(--apple-snow))] p-4">
              <div className="flex h-[220px] items-end gap-3 sm:h-[250px]">
                <SkeletonBlock className="h-[60%] flex-1 rounded-t-xl rounded-b-md" />
                <SkeletonBlock className="h-[50%] flex-1 rounded-t-xl rounded-b-md" />
                <SkeletonBlock className="h-[80%] flex-1 rounded-t-xl rounded-b-md" />
                <SkeletonBlock className="h-[66%] flex-1 rounded-t-xl rounded-b-md" />
                <SkeletonBlock className="h-[74%] flex-1 rounded-t-xl rounded-b-md" />
                <SkeletonBlock className="h-[56%] flex-1 rounded-t-xl rounded-b-md" />
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <SkeletonBlock className="h-3 w-44 rounded-full" />
              <SkeletonBlock className="h-3 w-28 rounded-full" />
            </div>
            <div className="rounded-[12px] border border-apple-mist bg-[rgb(var(--apple-snow))] p-5 shadow-[0_1px_3px_rgba(24,83,43,0.04)]">
              <div className="relative h-[240px] overflow-hidden sm:h-[270px]">
                <div className="absolute inset-x-0 top-[20%] border-t border-dashed border-apple-mist/80" />
                <div className="absolute inset-x-0 top-[46%] border-t border-dashed border-apple-mist/80" />
                <div className="absolute inset-x-0 top-[72%] border-t border-dashed border-apple-mist/80" />
                <div className="absolute bottom-0 left-[6%] right-[4%] top-[10%]">
                  <div className="absolute bottom-[14%] left-[6%] h-[34%] w-[14%] rounded-t-[32px] bg-apple-mist/60" />
                  <div className="absolute bottom-[14%] left-[22%] h-[48%] w-[14%] rounded-t-[32px] bg-apple-mist/70" />
                  <div className="absolute bottom-[14%] left-[38%] h-[30%] w-[14%] rounded-t-[32px] bg-apple-mist/60" />
                  <div className="absolute bottom-[14%] left-[54%] h-[64%] w-[14%] rounded-t-[32px] bg-apple-mist/80" />
                  <div className="absolute bottom-[14%] left-[70%] h-[44%] w-[14%] rounded-t-[32px] bg-apple-mist/65" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <SkeletonBlock className="h-3 w-40 rounded-full" />
            <div className="rounded-[12px] border border-apple-mist bg-[rgb(var(--apple-snow))] p-5 sm:h-[300px]">
              <div className="grid h-full gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <SkeletonBlock className="h-4 w-28 rounded-full" />
                    <SkeletonBlock className="h-7 flex-1 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AttendanceAnalyticsPageClient() {
  const searchParams = useSearchParams();
  const { data, loading, error, selectedPeriodKey, setSelectedPeriodKey } =
    useHistoricalDashboardData();
  const runIdFromQuery = searchParams.get("runId");
  const employees = data?.employees ?? [];
  const records = data?.records ?? [];
  const periodOptions = data?.periodOptions ?? [];
  const viewerRole = data?.viewerRole ?? null;
  const isCeo = viewerRole === "ceo";

  useEffect(() => {
    if (!runIdFromQuery) return;
    if (runIdFromQuery === selectedPeriodKey) return;
    setSelectedPeriodKey(runIdFromQuery);
  }, [runIdFromQuery, selectedPeriodKey, setSelectedPeriodKey]);

  return (
    <div className="space-y-4">
      <DashboardPageHero
        eyebrow="Data Analytics"
        title="Attendance Analytics"
        description="Track attendance distribution, overtime trends, workforce coverage, and daily labor utilization across all sites."
      />

      {periodOptions.length > 0 ? (
        <section className="rounded-[14px] border border-apple-mist bg-white p-4 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-apple-charcoal">
              Payroll Period
            </p>
            <select
              value={selectedPeriodKey ?? ""}
              onChange={(event) =>
                setSelectedPeriodKey(event.target.value || null)
              }
              className="h-11 min-w-[260px] rounded-[12px] border border-[#d9e2e6] bg-white px-3 text-sm text-[#334951] transition-all hover:border-[#0f6f74]/35 focus:border-[#0f6f74] focus:outline-none focus:ring-2 focus:ring-[#0f6f74]/10"
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
        <AttendanceAnalyticsLoadingState />
      ) : employees.length > 0 && records.length > 0 ? (
        <AttendanceAnalyticsSection employees={employees} records={records} />
      ) : error ? (
        <section className="rounded-[14px] border border-red-100 bg-red-50 p-6 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
          <p className="text-sm text-red-700">{error}</p>
        </section>
      ) : (
        <section className="rounded-[14px] border border-apple-mist bg-white p-6 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
          <p className="text-sm text-apple-smoke">
            {isCeo
              ? "No saved payroll periods yet."
              : "No attendance history has been uploaded yet."}
          </p>
        </section>
      )}
    </div>
  );
}
