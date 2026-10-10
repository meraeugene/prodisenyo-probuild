"use client";

import { useState } from "react";
import type { RentalIncomeRecord } from "../incomeTypes";
import { rentalPaymentTypeLabels, summarizeRentalIncome, type RentalIncomeTransaction } from "../utils/rentalIncomeSelectors";
import { formatRentalDate, formatRentalMoney } from "../utils/rentalUi";
import styles from "@/components/workspace/workspace.module.css";
import GmeaRentalIncomePaymentHistory from "./GmeaRentalIncomePaymentHistory";
import { rentalIncomeCharge } from "../utils/historicalIncomeMappers";
import tableStyles from "./rentalIncomeTables.module.css";

export default function GmeaRentalIncomeTransactionsTable({ transactions }: { transactions: RentalIncomeTransaction[] }) {
  const [selected, setSelected] = useState<RentalIncomeRecord | null>(null);
  const rentals = [...new Map(transactions.map(transaction => [transaction.rental.id, transaction.rental])).values()];
  return <><div className="overflow-x-auto">
    <table className={`${styles.table} ${tableStyles.incomeTable}`}>
      <caption className="sr-only">Rental income payments. Total Amount is the confirmed rental charge. Total is collected in the selected month. Select a company name for payment history.</caption>
      <thead><tr>{["Payment Date", "Company Name", "Location", "Amount", "Total Amount", "Total", "Mode of Payment"].map(label =>
        <th scope="col" key={label}>{label}</th>)}
      </tr></thead>
      {rentals.map(rental => {
        const receipts = transactions.filter(transaction => transaction.rental.id === rental.id);
        const payments = receipts.map(receipt => receipt.payment)
          .sort((left, right) => left.payment_date.localeCompare(right.payment_date) || left.id.localeCompare(right.id));
        const summary = summarizeRentalIncome(receipts);
        const charge = rentalIncomeCharge(rental);
        return <tbody key={rental.id}>{payments.map((payment, index) => <tr key={payment.id}>
          <td className="whitespace-nowrap"><div className="flex flex-col gap-1 text-xs">
            <span className="font-medium">{rentalPaymentTypeLabels[payment.payment_type ?? "unclassified"]}</span>
            <span>{formatRentalDate(payment.payment_date)}</span>
          </div></td>
          {index === 0 && <>
            <th scope="rowgroup" rowSpan={payments.length}><button type="button" className={`${styles.recordLink} text-left`} aria-label={`Payment history for ${rental.client}`} onClick={() => setSelected(rental)}>{rental.client}</button></th>
            <td rowSpan={payments.length}>{rental.location || "Not recorded"}</td>
          </>}
          <td className="whitespace-nowrap tabular-nums">{formatRentalMoney(payment.amount)}</td>
          {index === 0 && <>
            <td rowSpan={payments.length} className="whitespace-nowrap tabular-nums">{charge === null ? "Unconfirmed" : formatRentalMoney(charge)}</td>
            <td rowSpan={payments.length} className="whitespace-nowrap tabular-nums">{formatRentalMoney(summary.collected)}</td>
          </>}
          <td>{payment.method || "Not recorded"}</td>
        </tr>)}</tbody>;
      })}
    </table>
    {!rentals.length && <p role="status" className={styles.empty}>No payments received for this month and these filters.</p>}
  </div>{!!rentals.length && <p className="text-xs text-slate-500">Total Amount is the confirmed rental charge. Total is collected this month. Select a company name for payment history.</p>}
  {selected && <GmeaRentalIncomePaymentHistory rental={selected} onClose={() => setSelected(null)} />}</>;
}
