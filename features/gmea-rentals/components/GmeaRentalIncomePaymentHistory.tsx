import Link from "next/link";
import type { RentalIncomeRecord } from "../incomeTypes";
import { rentalPaymentTypeLabels } from "../utils/rentalIncomeSelectors";
import { formatRentalDate, formatRentalMoney } from "../utils/rentalUi";
import GmeaRentalsDialog from "./GmeaRentalsDialog";
import styles from "@/components/workspace/workspace.module.css";
import { rentalIncomeCharge } from "../utils/historicalIncomeMappers";
import { summarizeRentalPortfolio } from "../utils/rentalPortfolioSelectors";

export default function GmeaRentalIncomePaymentHistory({ rental, onClose, onAddPayment }: { rental: RentalIncomeRecord; onClose: () => void; onAddPayment?: () => void }) {
  const summary = summarizeRentalPortfolio([rental], []), charge = rentalIncomeCharge(rental);
  return <GmeaRentalsDialog title={`Payment history — ${rental.rental_number}`} description={`${rental.client} · ${rental.location}`}
    readOnly pending={false} saveLabel="Close" onClose={onClose}>
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-3 rounded border border-slate-200 p-4 text-sm">
        <div className="col-span-2"><dt className="text-slate-500">Rental service</dt><dd>{rental.items.map(item => item.equipment_name).join(", ") || "Not recorded"}</dd></div>
        <div><dt className="text-slate-500">Total rental amount</dt><dd>{charge === null ? "Unconfirmed" : formatRentalMoney(charge)}</dd></div>
        <div><dt className="text-slate-500">Total collected</dt><dd>{formatRentalMoney(summary.collected)}</dd></div>
        <div><dt className="text-slate-500">Not collected</dt><dd>{formatRentalMoney(summary.outstanding)}</dd></div>
      </dl>
      {onAddPayment && <button type="button" className={styles.primaryButton} onClick={onAddPayment}>Add payment</button>}
      {rental.payments.map(payment => <article key={payment.id}
      className={`space-y-1 rounded border p-4 text-sm ${payment.status === "voided" ? "border-rose-200 bg-rose-50" : "border-slate-200"}`}>
      <p className="font-semibold">{rentalPaymentTypeLabels[payment.payment_type ?? "unclassified"]}</p>
      <p>{formatRentalDate(payment.payment_date)} · {formatRentalMoney(payment.amount)}</p>
      <p>Method: {payment.method || "Not recorded"}</p><p>Reference: {payment.reference_number || "Not recorded"}</p>
      {payment.notes && <p className="whitespace-pre-wrap">{payment.notes}</p>}
      {payment.status === "voided" && <p className="font-medium text-rose-700">Voided: {payment.void_reason}</p>}
    </article>)}{rental.historical ? <p className="text-sm text-slate-500">Historical Excel income record. {rental.historical.source}</p>
      : rental.customerIncome ? <p className="text-sm text-slate-500">Customer rental income record.</p>
      : <Link className={styles.recordLink} href={`/gmea-rentals/${rental.id}`}>Open rental details</Link>}</div>
  </GmeaRentalsDialog>;
}
