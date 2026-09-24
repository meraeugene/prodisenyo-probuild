"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { getGmeaRentalAnalyticsAction } from "@/actions/gmeaRentals";
import type { RentalAnalyticsData } from "../utils/rentalAnalytics";
import {
  currentMonthRange,
  currentWeekRange,
  equipmentProfitability,
  reportSummary,
  type DateRange,
} from "../utils/rentalAnalytics";
import { formatRentalMoney, rentalInputClass } from "../utils/rentalUi";
import GmeaRentalsAnalyticsNav from "./GmeaRentalsAnalyticsNav";
import {
  GmeaRentalCalculationNote,
  GmeaRentalEquipmentProfitability,
  GmeaRentalExpenseBreakdown,
} from "./GmeaRentalReportDetails";

type Period = "week" | "month" | "custom";

export default function GmeaRentalsReports({
  initialData,
  canEdit,
}: {
  initialData: RentalAnalyticsData;
  canEdit: boolean;
}) {
  const { data = initialData } = useSWR(
    "gmea-rentals:analytics",
    getGmeaRentalAnalyticsAction,
    {
      fallbackData: initialData,
      revalidateOnFocus: !canEdit,
      refreshInterval: canEdit ? 0 : 30000,
    },
  );
  const [period, setPeriod] = useState<Period>("month");
  const [customRange, setCustomRange] = useState<DateRange>(currentMonthRange);
  const range =
    period === "week"
      ? currentWeekRange()
      : period === "month"
        ? currentMonthRange()
        : customRange;
  const validRange = range.start && range.end && range.start <= range.end;
  const summary = reportSummary(
    data,
    validRange ? range : { start: "9999-01-01", end: "0001-01-01" },
  );
  const profitability = useMemo(() => equipmentProfitability(data), [data]);

  return (
    <main className="min-h-full bg-white px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8">
      <div className="mx-auto max-w-[1440px] space-y-4">
        <header className="rounded-[22px] bg-[#075e5b] px-6 py-7 text-white shadow-[0_18px_45px_-32px_rgba(3,62,60,.7)] sm:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/75">
            GMEA Marketing Corporation
          </p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[34px] font-bold tracking-[-0.045em] sm:text-[42px]">
                Rental reports
              </h1>
              <p className="mt-2 text-sm text-white/80">
                Financial performance calculated from posted collections and
                recorded expenses.
              </p>
            </div>
            <GmeaRentalsAnalyticsNav />
          </div>
        </header>

        <section className="rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-[16px] font-bold tracking-[-0.025em] text-slate-950">
                Reporting period
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Revenue uses posted payment dates; expenses use their recorded
                expense date.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="text-xs font-semibold text-slate-700">
                View
                <select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value as Period)}
                  className={rentalInputClass + " mt-1"}
                >
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="custom">Custom range</option>
                </select>
              </label>
              {period === "custom" && (
                <>
                  <DateField
                    label="From"
                    value={customRange.start}
                    onChange={(start) =>
                      setCustomRange((current) => ({ ...current, start }))
                    }
                  />
                  <DateField
                    label="To"
                    value={customRange.end}
                    onChange={(end) =>
                      setCustomRange((current) => ({ ...current, end }))
                    }
                  />
                </>
              )}
            </div>
          </div>
          {!validRange && (
            <p role="alert" className="mt-3 text-xs font-medium text-rose-700">
              Choose an end date that is on or after the start date.
            </p>
          )}
        </section>

        <section className="grid gap-3.5 sm:grid-cols-3">
          <ReportCard
            label="Rental revenue"
            value={summary.revenue}
            tone="text-[#087d76]"
          />
          <ReportCard
            label="Total expenses"
            value={summary.totalExpenses}
            tone="text-amber-700"
          />
          <ReportCard
            label="Net profit / loss"
            value={summary.net}
            tone={summary.net < 0 ? "text-rose-700" : "text-[#087d76]"}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <GmeaRentalExpenseBreakdown summary={summary} />
          <GmeaRentalCalculationNote />
        </section>
        <GmeaRentalEquipmentProfitability items={profitability} />
      </div>
    </main>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs font-semibold text-slate-700">
      {label}
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={rentalInputClass + " mt-1"}
      />
    </label>
  );
}

function ReportCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <article className="rounded-[12px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)]">
      <p className="text-xs font-semibold text-slate-700">{label}</p>
      <p
        className={
          "mt-2 text-[22px] font-semibold tracking-[-0.035em] tabular-nums " +
          tone
        }
      >
        {formatRentalMoney(value)}
      </p>
    </article>
  );
}
