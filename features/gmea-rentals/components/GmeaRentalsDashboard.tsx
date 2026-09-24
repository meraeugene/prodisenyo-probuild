"use client";

import Link from "next/link";
import { CalendarClock, ReceiptText, TrendingUp, Truck } from "lucide-react";
import useSWR from "swr";
import { getGmeaRentalAnalyticsAction } from "@/actions/gmeaRentals";
import type { RentalAnalyticsData } from "../utils/rentalAnalytics";
import {
  equipmentStatusCounts,
  expenseTotal,
  paidRevenue,
} from "../utils/rentalAnalytics";
import { formatRentalDate, formatRentalMoney } from "../utils/rentalUi";
import GmeaRentalsAnalyticsNav from "./GmeaRentalsAnalyticsNav";
import RentalStatusBadge from "./RentalStatusBadge";

export default function GmeaRentalsDashboard({
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
  const revenue = paidRevenue(data.payments);
  const expenses = expenseTotal(data.expenses);
  const equipment = equipmentStatusCounts(data.equipment);
  const today = new Date().toISOString().slice(0, 10);
  const recentRentals = [...data.rentals].slice(0, 5);
  const recentExpenses = [...data.expenses]
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        b.created_at.localeCompare(a.created_at),
    )
    .slice(0, 5);
  const upcoming = data.rentals
    .filter(
      (rental) => rental.start_date >= today && rental.status !== "cancelled",
    )
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 5);
  const cards = [
    [
      "Active rentals",
      data.rentals.filter((rental) => rental.status === "active").length,
      CalendarClock,
    ],
    ["Rental revenue", formatRentalMoney(revenue), TrendingUp],
    ["Total expenses", formatRentalMoney(expenses), ReceiptText],
    ["Net profit/loss", formatRentalMoney(revenue - expenses), TrendingUp],
    ["Available equipment", equipment.available, Truck],
    ["On rental", equipment.onRental, Truck],
    ["Maintenance", equipment.maintenance, Truck],
  ] as const;

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
                Rentals dashboard
              </h1>
              <p className="mt-2 text-sm text-white/80">
                A live view of rental operations, collections, and expenses.
              </p>
            </div>
            <GmeaRentalsAnalyticsNav />
          </div>
        </header>

        <section
          aria-label="Rental dashboard summary"
          className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4"
        >
          {cards.map(([label, value, Icon]) => (
            <article
              key={label}
              className="rounded-[12px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)]"
            >
              <div className="flex items-center gap-2">
                <Icon size={13} className="text-[#087d76]" />
                <p className="text-xs font-semibold text-slate-700">{label}</p>
              </div>
              <p className="mt-2 text-[22px] font-semibold tracking-[-0.035em] text-slate-950 tabular-nums">
                {value}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <DashboardList
            title="Recent rentals"
            empty="No rental records yet."
            count={recentRentals.length}
          >
            {recentRentals.map((rental) => (
              <Link
                key={rental.id}
                href={"/gmea-rentals/" + rental.id}
                className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {rental.rental_number} / {rental.client}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {rental.location}
                  </p>
                </div>
                <RentalStatusBadge status={rental.status} />
              </Link>
            ))}
          </DashboardList>
          <DashboardList
            title="Upcoming rentals"
            empty="No upcoming rentals."
            count={upcoming.length}
          >
            {upcoming.map((rental) => (
              <Link
                key={rental.id}
                href={"/gmea-rentals/" + rental.id}
                className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {rental.rental_number} / {rental.client}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Starts {formatRentalDate(rental.start_date)}
                  </p>
                </div>
                <RentalStatusBadge status={rental.status} />
              </Link>
            ))}
          </DashboardList>
          <DashboardList
            title="Recent expenses"
            empty="No expense records yet."
            count={recentExpenses.length}
          >
            {recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {expense.description}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatRentalDate(expense.date)}
                    {expense.supplier ? " / " + expense.supplier : ""}
                  </p>
                </div>
                <strong className="shrink-0 text-sm text-slate-900 tabular-nums">
                  {formatRentalMoney(expenseTotal([expense]))}
                </strong>
              </div>
            ))}
          </DashboardList>
          <DashboardList
            title="Equipment status"
            empty="No equipment records yet."
            count={Math.min(data.equipment.length, 5)}
          >
            {data.equipment.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {item.code}
                    {item.equipment_type ? " / " + item.equipment_type : ""}
                  </p>
                </div>
                <RentalStatusBadge status={item.status} />
              </div>
            ))}
          </DashboardList>
        </section>
      </div>
    </main>
  );
}

function DashboardList({
  title,
  empty,
  count,
  children,
}: {
  title: string;
  empty: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)]">
      <h2 className="text-[16px] font-bold tracking-[-0.025em] text-slate-950">
        {title}
      </h2>
      <div className="mt-2 divide-y divide-slate-100">
        {count ? (
          children
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">{empty}</p>
        )}
      </div>
    </article>
  );
}
