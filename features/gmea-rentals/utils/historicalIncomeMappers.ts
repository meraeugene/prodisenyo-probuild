import type { HistoricalIncomeRecord, RentalIncomeRecord } from "../incomeTypes";

export function mapHistoricalIncomeRecords(records: HistoricalIncomeRecord[], recordedAt: string, actor: string): RentalIncomeRecord[] {
  return records.map(record => ({
    id: record.id, rental_number: record.source, client: record.client, location: record.location,
    status: "completed", start_date: record.receipts.filter(receipt => receipt.confirmed)
      .map(receipt => receipt.date!).sort()[0] || "",
    historical: record,
    items: [{ id: record.id, equipment_id: "", equipment_name: record.service || "Not recorded",
      rate_type: "fixed", unit_rate: record.charge ?? 0, quantity: 1, subtotal: record.charge ?? 0 }],
    payments: record.receipts.filter(receipt => receipt.confirmed).map(receipt => ({
      id: receipt.id, rental_id: record.id, amount: receipt.amount, payment_date: receipt.date!, payment_type: receipt.type,
      method: receipt.method, reference_number: receipt.source, notes: `Imported from ${record.source}.`,
      status: "posted", recorded_by: actor, recorded_at: recordedAt, voided_by: null, voided_at: null, void_reason: "",
    })),
  }));
}

export function rentalIncomeCharge(record: RentalIncomeRecord) {
  return record.historical ? record.historical.charge : record.items.reduce((total, item) => total + item.subtotal, 0);
}
