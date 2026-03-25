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
  const calendarDays = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);

  if (!show || !isMounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex min-h-dvh w-screen items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-2xl border border-apple-mist bg-white shadow-apple-xs p-5 sm:p-6 space-y-4 max-h-[88vh] overflow-y-auto">
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
              <p className="mt-2 inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                Payroll Range: {periodStart ?? "-"} to {periodEnd ?? "-"}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-apple-charcoal text-white hover:bg-apple-black transition flex items-center justify-center"
            aria-label="Close paid holiday modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onLoadPhilippineHolidays}
            className="px-3.5 py-2 rounded-xl border border-apple-silver text-xs font-semibold text-apple-ash hover:border-apple-charcoal transition"
          >
            Auto Add Philippine Holidays
          </button>
          <button
            type="button"
            onClick={onClearHolidays}
            disabled={holidays.length === 0}
            className="px-3.5 py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4">
          <div className="rounded-2xl border border-apple-mist  p-4">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() =>
                  setViewMonth(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                  )
                }
                className="p-1.5 rounded-lg border border-apple-silver text-apple-ash hover:border-apple-charcoal transition"
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
                className="p-1.5 rounded-lg border border-apple-silver text-apple-ash hover:border-apple-charcoal transition"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span
                  key={day}
                  className="text-2xs font-semibold uppercase tracking-wider text-apple-steel text-center py-1"
                >
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="h-10 rounded-lg border border-transparent"
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
                    ? "border-sky-700 bg-sky-600 text-white"
                    : isInPayrollRange
                      ? "border-slate-700 bg-slate-700 text-white"
                      : "border-apple-charcoal bg-apple-charcoal text-white"
                  : isHoliday
                    ? "border-sky-300 bg-sky-200 text-sky-800"
                    : isInPayrollRange
                      ? "border-slate-300 bg-slate-100 text-slate-700 hover:border-slate-500"
                      : "border-apple-mist bg-white text-apple-charcoal hover:border-apple-charcoal";

                return (
                  <button
                    key={isoDate}
                    type="button"
                    onClick={() => setSelectedDate(isoDate)}
                    className={`h-10 rounded-lg border text-xs font-semibold transition ${dayClass}`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-apple-mist bg-white p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-apple-charcoal">
              <CalendarDays size={16} />
              Manual Holiday Entry
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-10 px-3 rounded-2xl border border-apple-silver bg-white text-sm text-apple-charcoal focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15 focus:border-apple-charcoal transition-all"
            />
            <input
              type="text"
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
              placeholder="Holiday name (optional)"
              className="w-full h-10 px-3 rounded-2xl border border-apple-silver bg-white text-sm text-apple-charcoal focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15 focus:border-apple-charcoal transition-all"
            />

            <button
              type="button"
              onClick={() => {
                if (!selectedDate) return;
                onAddManualHoliday(selectedDate, holidayName);
                setHolidayName("");
              }}
              disabled={!selectedDate}
              className="w-full h-10 rounded-2xl bg-apple-charcoal text-white text-sm font-semibold hover:bg-apple-black/780 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Holiday
            </button>

            <div className="pt-2 border-t border-apple-mist">
              <p className="text-2xs font-semibold uppercase tracking-widest text-apple-steel mb-2">
                Selected Holidays ({holidays.length})
              </p>
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {holidays.length === 0 ? (
                  <p className="text-xs text-apple-steel">
                    No holidays selected yet.
                  </p>
                ) : (
                  holidays.map((holiday) => (
                    <div
                      key={holiday.date}
                      className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 flex items-center gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-sky-700">
                          {holiday.name}
                        </p>
                        <p className="text-2xs text-sky-600">
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
    </div>,
    document.body,
  );
}
