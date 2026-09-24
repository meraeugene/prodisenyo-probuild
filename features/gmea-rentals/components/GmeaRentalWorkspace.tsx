"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  MapPin,
  Truck,
  UserRound,
  WalletCards,
} from "lucide-react";
import type { GmeaRental, RentalOperationsData } from "../types";
import {
  getGmeaRentalAction,
  getGmeaRentalOperationsAction,
} from "@/actions/gmeaRentals";
import {
  formatRentalDate,
  formatRentalMoney,
  rentalLabel,
} from "../utils/rentalUi";
import RentalStatusBadge from "./RentalStatusBadge";
import GmeaRentalCollectionsSection from "./GmeaRentalCollectionsSection";
import GmeaRentalCrewSection from "./GmeaRentalCrewSection";
import GmeaRentalExpensesSection from "./GmeaRentalExpensesSection";
export default function GmeaRentalWorkspace({
  rental: initialRental,
  initialOperations,
  canEdit,
}: {
  rental: GmeaRental;
  initialOperations: RentalOperationsData;
  canEdit: boolean;
}) {
  const [tab, setTab] = useState<
    "Equipment" | "Collections" | "Expenses" | "Drivers / Operators"
  >("Equipment");
  const { data: rental = initialRental } = useSWR(
    ["gmea-rental", initialRental.id],
    ([, id]) => getGmeaRentalAction(id),
    {
      fallbackData: initialRental,
      revalidateOnFocus: false,
      refreshInterval: canEdit ? 0 : 30000,
    },
  );
  const { data: operations = initialOperations } = useSWR(
    "gmea-rentals:operations",
    getGmeaRentalOperationsAction,
    {
      fallbackData: initialOperations,
      revalidateOnFocus: false,
      refreshInterval: canEdit ? 0 : 30000,
    },
  );
  const total = rental.items.reduce((sum, item) => sum + item.subtotal, 0);
  return (
    <main className="min-h-full bg-white px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8">
      <div className="mx-auto max-w-[1440px] space-y-5">
        <Link
          href="/gmea-rentals"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-700"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          GMEA Rentals
        </Link>
        <header
          id="overview"
          className="rounded-[22px] bg-[#075e5b] p-6 text-white shadow-[0_18px_45px_-32px_rgba(3,62,60,.7)] sm:p-8"
        >
          <div className="flex flex-col justify-between gap-5 sm:flex-row">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/70">
                GMEA Rental Workspace
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                {rental.rental_number}
              </h1>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/80">
                <span className="inline-flex items-center gap-2">
                  <UserRound size={14} aria-hidden="true" />
                  {rental.client}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin size={14} aria-hidden="true" />
                  {rental.location}
                </span>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={14} aria-hidden="true" />
                  {formatRentalDate(rental.start_date)} –{" "}
                  {formatRentalDate(rental.end_date)}
                </span>
              </div>
            </div>
            <RentalStatusBadge status={rental.status} />
          </div>
        </header>
        <section
          aria-label="Rental summary"
          className="grid gap-4 sm:grid-cols-3"
        >
          {[
            {
              label: "Rental amount",
              value: formatRentalMoney(total),
              caption: "Total of all equipment items",
              icon: WalletCards,
              tone: "text-teal-700",
            },
            {
              label: "Equipment units",
              value: String(rental.items.length),
              caption: "Units assigned to this rental",
              icon: Truck,
              tone: "text-sky-700",
            },
            {
              label: "Rental period",
              value: `${formatRentalDate(rental.start_date)} – ${formatRentalDate(rental.end_date)}`,
              caption: "Scheduled reservation window",
              icon: CalendarRange,
              tone: "text-violet-700",
            },
          ].map(({ label, value, caption, icon: Icon, tone }) => (
            <article
              key={label}
              className="min-h-28 min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,.045)]"
            >
              <div className="flex items-center gap-2">
                <Icon size={14} className={tone} aria-hidden="true" />
                <p className="text-sm font-medium text-slate-500">{label}</p>
              </div>
              <p className="mt-1 break-words text-xl font-semibold tracking-tight text-slate-950 tabular-nums xl:text-2xl">
                {value}
              </p>
              <p className="mt-1 text-xs text-slate-400">{caption}</p>
            </article>
          ))}
        </section>

        <nav
          aria-label="Rental sections"
          className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5"
        >
          {(
            [
              "Equipment",
              "Collections",
              "Expenses",
              "Drivers / Operators",
            ] as const
          ).map((label) => (
            <button
              key={label}
              type="button"
              aria-current={tab === label ? "page" : undefined}
              onClick={() => setTab(label)}
              className={
                "whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-medium transition-colors " +
                (tab === label
                  ? "bg-[#076d69] text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
              }
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === "Equipment" && (
          <section
            id="equipment"
            className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,.055)] sm:p-7"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Equipment
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Billing quantities are manually entered.
                </p>
              </div>
              <strong className="text-lg text-slate-950 tabular-nums">
                {formatRentalMoney(total)}
              </strong>
            </div>
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Equipment</th>
                      <th className="px-4 py-3.5">Rate type</th>
                      <th className="px-4 py-3.5">Unit rate</th>
                      <th className="px-4 py-3.5">Quantity</th>
                      <th className="px-5 py-3.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rental.items.map((item) => (
                      <tr
                        key={item.id}
                        className="text-slate-700 hover:bg-slate-50/60"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-950">
                          {item.equipment_name}
                        </td>
                        <td className="px-4 py-4">
                          {rentalLabel(item.rate_type)}
                        </td>
                        <td className="px-4 py-4 tabular-nums">
                          {formatRentalMoney(item.unit_rate)}
                        </td>
                        <td className="px-4 py-4 tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-slate-950 tabular-nums">
                          {formatRentalMoney(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {rental.notes && (
              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Notes
                </p>
                <p className="mt-1 text-sm">{rental.notes}</p>
              </div>
            )}
          </section>
        )}
        {tab === "Collections" && (
          <div className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,.055)] sm:p-7">
            <GmeaRentalCollectionsSection rental={rental} canEdit={canEdit} />
          </div>
        )}
        {tab === "Expenses" && (
          <div className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,.055)] sm:p-7">
            <GmeaRentalExpensesSection
              rental={rental}
              operations={operations}
              canEdit={canEdit}
            />
          </div>
        )}
        {tab === "Drivers / Operators" && (
          <div className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,.055)] sm:p-7">
            <GmeaRentalCrewSection
              rental={rental}
              workers={operations.workers}
              canEdit={canEdit}
            />
          </div>
        )}
      </div>
    </main>
  );
}
