"use client";

import {
  type TooltipProps,
} from "recharts";
import type { DailyLogRow } from "@/types";
import { formatPayrollNumber } from "@/features/payroll/utils/payrollFormatters";

export const EMPLOYEE_ANALYTICS_COLORS = [
  "#15803d",
  "#f97316",
  "#dc2626",
  "#2563eb",
  "#a855f7",
];

export const DAILY_HOURS_LINE_COLOR = "#15803d";
export const DAILY_HOURS_AREA_COLOR = "#22c55e";
export const DAILY_HOURS_GRID_COLOR = "#bbf7d0";
export const CLOCK_IN_BAR_TOP_COLOR = "#15803d";
export const CLOCK_IN_BAR_BOTTOM_COLOR = "#4ade80";
export const CLOCK_IN_GRID_COLOR = "#d1fae5";
export const OVERTIME_ALERT_HOURS = 10;

export type AdjustmentFormType =
  | "cashAdvance"
  | "overtime"
  | "paidLeave"
  | null;

export function parseNonNegativeValue(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function isExpandedPlaceholderLog(log: DailyLogRow): boolean {
  return (
    log.site.trim() === "" &&
    !log.time1In &&
    !log.time1Out &&
    !log.time2In &&
    !log.time2Out &&
    !log.otIn &&
    !log.otOut
  );
}

export function createEntryId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function formatPeso(value: number): string {
  return `\u20B1${formatPayrollNumber(value)}`;
}

export function getAttendanceBreakdownColor(name: string, index: number): string {
  const key = name.trim().toLowerCase();
  if (key.includes("attendance")) return "#15803d";
  if (key.includes("leave")) return "#f97316";
  if (key.includes("absence")) return "#dc2626";
  if (key.includes("business trip")) return "#2563eb";
  return EMPLOYEE_ANALYTICS_COLORS[index % EMPLOYEE_ANALYTICS_COLORS.length];
}

export function chartTickFormatter(value: string): string {
  if (!value) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.slice(5) : value;
}

export function AnalyticsTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: TooltipProps<number, string> & {
  valueFormatter?: (value: number, name: string, item: any) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="min-w-[148px] rounded-xl border border-apple-mist bg-white px-3 py-2 shadow-[0_10px_28px_rgba(2,6,23,0.08)]">
      {label ? (
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-apple-smoke">
          {label}
        </p>
      ) : null}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const numericValue =
            typeof entry.value === "number"
              ? entry.value
              : Number(entry.value ?? 0);
          const name = String(entry.name ?? entry.dataKey ?? "Value");

          return (
            <div key={`${name}-${index}`} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: entry.color ?? "rgb(var(--theme-chart-2))",
                }}
              />
              <span className="text-[11px] text-apple-smoke">{name}</span>
              <span className="ml-auto text-[12px] font-semibold text-apple-charcoal">
                {valueFormatter
                  ? valueFormatter(numericValue, name, entry.payload)
                  : formatPayrollNumber(numericValue)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
