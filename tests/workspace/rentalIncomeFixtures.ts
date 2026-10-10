import type { RentalPayment } from "@/features/gmea-rentals/types";
import { rentals } from "../ceo/fixtures";
import { mapHistoricalIncomeRecords } from "@/features/gmea-rentals/utils/historicalIncomeMappers";

function payment(id: string, rental_id: string, amount: number, payment_date: string, payment_type?: RentalPayment["payment_type"]): RentalPayment {
  return { id, rental_id, amount, payment_date, payment_type, status: "posted", method: "Cash", reference_number: "REF-" + id,
    notes: "Customer receipt", recorded_by: "gmea", recorded_at: payment_date + "T08:00:00Z", voided_by: null, voided_at: null, void_reason: "" };
}

export const incomeRentals = rentals.map((rental, index) => ({ ...rental, start_date: "2026-04-01", payments: index === 0 ? [
  payment("dp-1", rental.id, 10000, "2026-04-30", "down_payment"), payment("fp-1", rental.id, 10000, "2026-05-09", "full_payment"),
] : index === 1 ? [payment("dp-2", rental.id, 5000, "2026-05-07", "down_payment"), payment("partial-2", rental.id, 1000, "2026-05-12", "partial_payment")]
  : index === 2 ? [payment("legacy-3", rental.id, 2000, "2026-05-08")] : [] }));

export const historicalIncome = mapHistoricalIncomeRecords([{
  id:"historical-1",client:"Harbor Logistics",location:"Bayanga",service:"Backhoe",source:"CUSTOMER TRANSACTION rows 98–98",
  charge:null,issues:["Payment columns conflict. Confirm the amounts and dates."],
  receipts:[{id:"held-1",amount:18000,date:null,type:"full_payment",method:"Cash",source:"J98",confirmed:false}],
  sourceRows:[{row:98,E:"Jan 14,2026",F:"Harbor Logistics",G:"Bayanga",H:9000,J:18000,K:18000}],
}],"2026-10-10T00:00:00Z","gmea");
