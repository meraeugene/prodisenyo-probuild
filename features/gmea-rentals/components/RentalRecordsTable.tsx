import Link from "next/link";
import type { GmeaRental } from "../types";
import { formatRentalDate, formatRentalMoney } from "../utils/rentalUi";
import { buildRentalAmounts } from "../utils/rentalRecordSelectors";
import RentalStatusBadge from "./RentalStatusBadge";
import styles from "@/components/workspace/workspace.module.css";

export default function RentalRecordsTable({ rentals }: { rentals: GmeaRental[] }) {
  return <div className="overflow-x-auto">
    <table className={styles.table}>
      <caption className="sr-only">Rental schedules, customers, and collections</caption>
      <thead><tr>{["Rental", "Client / Location", "Rental period", "Amount", "Collected", "Outstanding", "Status", "Actions"].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{rentals.map((rental) => {
        const amounts = buildRentalAmounts(rental);
        return <tr key={rental.id}>
          <th scope="row" className="font-normal"><Link className={styles.recordLink} href={`/gmea-rentals/${rental.id}`}>{rental.rental_number}</Link><p className="mt-1 text-xs text-slate-500">{rental.items.length} equipment units</p></th>
          <td><p>{rental.client}</p><p className="mt-1 text-xs text-slate-500">{rental.location}</p></td>
          <td className="whitespace-nowrap text-xs text-slate-600">{formatRentalDate(rental.start_date)}<span className="mt-1 block">to {formatRentalDate(rental.end_date)}</span></td>
          <td className="whitespace-nowrap tabular-nums">{formatRentalMoney(amounts.amount)}</td>
          <td className="whitespace-nowrap tabular-nums">{formatRentalMoney(amounts.collected)}</td>
          <td className="whitespace-nowrap tabular-nums">{formatRentalMoney(amounts.outstanding)}</td>
          <td><RentalStatusBadge status={rental.status} /></td>
          <td><Link href={`/gmea-rentals/${rental.id}`} aria-label={`View ${rental.rental_number}`} className={`${styles.button} whitespace-nowrap`}>View details</Link></td>
        </tr>;
      })}</tbody>
    </table>
    {!rentals.length && <p role="status" className={styles.empty}>No matching rentals. Try another search or reset the filters.</p>}
  </div>;
}
