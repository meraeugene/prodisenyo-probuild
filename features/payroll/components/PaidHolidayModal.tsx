"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PaidHolidayItem } from "@/features/payroll/types";
import { isIsoDateWithinRange } from "@/features/payroll/utils/payrollDateHelpers";

interface PaidHolidayModalProps {
  show: boolean;
  holidays: PaidHolidayItem[];
  periodStart: string | null;
  periodEnd: string | null;
  onClose: () => void;
  onAddManualHoliday: (date: string, name: string) => void;
  onRemoveHoliday: (date: string) => void;
  onLoadPhilippineHolidays: () => void;
  onClearHolidays: () => void;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCalendarDays(viewMonth: Date): Array<Date | null> {
  const firstDay = startOfMonth(viewMonth);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth() + 1,
    0,
  ).getDate();

  const calendarCells: Array<Date | null> = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    calendarCells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    calendarCells.push(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day),
    );
  }

  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  return calendarCells;
}

export default function PaidHolidayModal({
  show,
  holidays,
  periodStart,
  periodEnd,
  onClose,
  onAddManualHoliday,
  onRemoveHoliday,
  onLoadPhilippineHolidays,
  onClearHolidays,
}: PaidHolidayModalProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!show) return;
    const seedDate = periodStart
      ? new Date(`${periodStart}T00:00:00`)
      : new Date();
    setSelectedDate(periodStart ?? toIsoDate(seedDate));
    setViewMonth(startOfMonth(seedDate));
  }, [show, periodStart]);

  useEffect(() => {
    if (!show) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow || "auto";
    };
  }, [show]);

  const holidaysByDate = useMemo(
    () => new Map(holidays.map((holiday) => [holiday.date, holiday])),
    [holidays],
  );
  const visibleHolidays = useMemo(() => {
    if (!periodStart && !periodEnd) return holidays;

    const periodYearText = (periodStart ?? periodEnd ?? "").slice(0, 4);
    const periodYear = Number.parseInt(periodYearText, 10);
    if (!Number.isFinite(periodYear)) return holidays;

    return holidays.filter(
      (holiday) => Number.parseInt(holiday.date.slice(0, 4), 10) === periodYear,
    );
  }, [holidays, periodEnd, periodStart]);
  const calendarDays = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);

  if (!show || !isMounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex min-h-dvh w-screen items-center justify-center bg-black/45 p-0 sm:p-4 backdrop-blur-sm">
      <div className="h-[100dvh] w-full max-w-4xl overflow-y-auto border border-emerald-200 bg-[#f7fcf8] p-4 shadow-[0_24px_72px_rgba(17,94,50,0.18)] sm:max-h-[88vh] sm:h-auto sm:rounded-2xl sm:p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-apple-charcoal">
                Paid Holidays
              </h3>
              <p className="text-sm text-apple-smoke">
                Add holidays automatically (Philippines) or manually using the
                calendar.
              </p>
              {(periodStart || periodEnd) && (
                <p className="mt-2 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  Payroll Range: {periodStart ?? "-"} to {periodEnd ?? "-"}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1f6a37] text-white transition hover:bg-[#18552d] sm:h-8 sm:w-8 sm:rounded-full"
              aria-label="Close paid holiday modal"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={onLoadPhilippineHolidays}
              className="w-full rounded-xl border border-emerald-700 bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 sm:w-auto"
            >
              Auto Add Philippine Holidays
            </button>
            <button
              type="button"
              onClick={onClearHolidays}
              disabled={holidays.length === 0}
              className="w-full rounded-xl border border-emerald-200 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4">
            <div className="rounded-2xl border border-emerald-200 bg-white p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() =>
                    setViewMonth(
                      (prev) =>
                        new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                    )
                  }
                  className="p-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:border-emerald-500 transition"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>

                <p className="text-sm font-semibold text-apple-charcoal">
                  {viewMonth.toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setViewMonth(
                      (prev) =>
                        new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                    )
                  }
                  className="p-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:border-emerald-500 transition"
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <span
                      key={day}
                      className="text-2xs font-semibold uppercase tracking-wider text-apple-steel text-center py-1"
                    >
                      {day}
                    </span>
                  ),
                )}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="h-9 rounded-lg border border-transparent sm:h-10"
                      />
                    );
                  }

                  const isoDate = toIsoDate(date);
                  const isSelected = isoDate === selectedDate;
                  const isHoliday = holidaysByDate.has(isoDate);
                  const isInPayrollRange = isIsoDateWithinRange(
                    isoDate,
                    periodStart,
                    periodEnd,
                  );
                  const dayClass = isSelected
                    ? isHoliday
                      ? "border-emerald-900 bg-emerald-900 text-white"
                      : isInPayrollRange
                        ? "border-emerald-800 bg-emerald-800 text-white"
                        : "border-[#1f6a37] bg-[#1f6a37] text-white"
                    : isHoliday
                      ? "border-emerald-700 bg-emerald-600 text-white"
                      : isInPayrollRange
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                        : "border-emerald-100 bg-white text-apple-charcoal hover:border-emerald-500";

                  return (
                    <button
                      key={isoDate}
                      type="button"
                      onClick={() => setSelectedDate(isoDate)}
                      className={`h-9 rounded-lg border text-xs font-semibold transition sm:h-10 ${dayClass}`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/30 p-3 sm:p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-apple-charcoal">
                <CalendarDays size={16} />
                Manual Holiday Entry
              </div>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-10 px-3 rounded-2xl border border-emerald-200 bg-white text-sm text-apple-charcoal focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
              />
              <input
                type="text"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                placeholder="Holiday name (optional)"
                className="w-full h-10 px-3 rounded-2xl border border-emerald-200 bg-white text-sm text-apple-charcoal focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
              />

              <button
                type="button"
                onClick={() => {
                  if (!selectedDate) return;
                  onAddManualHoliday(selectedDate, holidayName);
                  setHolidayName("");
                }}
                disabled={!selectedDate}
                className="w-full h-10 rounded-2xl bg-[#1f6a37] text-white text-sm font-semibold hover:bg-[#18552d] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Holiday
              </button>

              <div className="pt-2 border-t border-emerald-200">
                <p className="text-2xs font-semibold uppercase tracking-widest text-apple-steel mb-2">
                  Selected Holidays ({visibleHolidays.length})
                </p>
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {visibleHolidays.length === 0 ? (
                    <p className="text-xs text-apple-steel">
                      No holidays selected yet.
                    </p>
                  ) : (
                    visibleHolidays.map((holiday) => (
                      <div
                        key={holiday.date}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-emerald-800">
                            {holiday.name}
                          </p>
                          <p className="text-2xs text-emerald-700">
                            {holiday.date}
                            {holiday.source === "ph" ? " - PH" : " - Manual"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveHoliday(holiday.date)}
                          className="ml-auto px-2.5 py-1 rounded-lg border border-red-200 text-2xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 transition"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
