import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, UserRound } from "lucide-react";
import type { GmeaRental } from "../types";
import { formatRentalDate, formatRentalMoney } from "../utils/rentalUi";
import RentalStatusBadge from "./RentalStatusBadge";

export default function GmeaRentalPortfolioCard({
  rental,
}: {
  rental: GmeaRental;
}) {
  const total = rental.items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <article className="group relative isolate flex min-w-0 flex-col overflow-hidden rounded-[16px] border border-slate-200/80 bg-white shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)] transition-shadow hover:shadow-[0_14px_32px_-20px_rgba(15,23,42,.38)]">
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[16px] font-bold leading-5 tracking-[-0.02em] text-slate-950">
              {rental.rental_number}
            </h3>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {rental.items.length} equipment{" "}
              {rental.items.length === 1 ? "unit" : "units"}
            </p>
          </div>
          <RentalStatusBadge status={rental.status} />
        </div>
        <div className="mt-3 grid gap-1.5 text-[13px] text-slate-500 sm:grid-cols-2">
          <p className="flex items-center gap-2">
            <UserRound size={13} aria-hidden="true" />
            <span className="truncate">{rental.client}</span>
          </p>
          <p className="flex items-center gap-2">
            <MapPin size={13} aria-hidden="true" />
            <span className="truncate">{rental.location}</span>
          </p>
          <p className="flex items-center gap-2 sm:col-span-2">
            <CalendarDays size={13} aria-hidden="true" />
            <span>
              {formatRentalDate(rental.start_date)} –{" "}
              {formatRentalDate(rental.end_date)}
            </span>
          </p>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-3.5">
          <p className="text-[12px] text-slate-500">Rental amount</p>
          <p className="mt-1 truncate text-[18px] font-semibold tracking-[-0.025em] text-slate-950 tabular-nums">
            {formatRentalMoney(total)}
          </p>
        </div>
      </div>
      <footer className="border-t border-slate-100 bg-slate-50/45 px-5 py-3">
        <Link
          href={`/gmea-rentals/${rental.id}`}
          className="inline-flex items-center gap-2 text-[13px] font-bold text-[#08746f] after:absolute after:inset-0 after:z-10 after:rounded-[16px] after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-teal-700"
        >
          Open rental <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </footer>
    </article>
  );
}
