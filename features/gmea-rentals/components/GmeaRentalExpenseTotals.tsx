import { formatRentalMoney } from "../utils/rentalUi";
export default function GmeaRentalExpenseTotals({ totals }: { totals: { base: number; vat: number; gross: number } }) {
  return <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4 text-sm sm:col-span-2 lg:col-span-3"><div className="grid gap-3 sm:grid-cols-3">{[["Base", totals.base], ["Input VAT", totals.vat], ["Total", totals.gross]].map(([label,amount]) => <p key={label}><span className="block text-xs text-slate-500">{label}</span><strong>{formatRentalMoney(Number(amount))}</strong></p>)}</div></div>;
}
