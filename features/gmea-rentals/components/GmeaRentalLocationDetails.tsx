"use client";
import { ArrowLeft } from "lucide-react";
import type { RentalLocation } from "../utils/rentalPortfolioSelectors";
import type { GmeaRental, RentalOperationsData } from "../types";
import GmeaRentalFinancialSummary from "./GmeaRentalFinancialSummary";
import GmeaRentalTransactions from "./GmeaRentalTransactions";
import { useRentalTransactions } from "../hooks/useRentalTransactions";

export default function GmeaRentalLocationDetails({ location, operations, rentals, canEdit, onBack }: {
  location: RentalLocation; operations: RentalOperationsData; rentals: GmeaRental[]; canEdit: boolean; onBack: () => void;
}) {
  const transactions = useRentalTransactions(location.rentals);
  return <section aria-label="Rental location details" className="space-y-4">
    <button type="button" className="inline-flex items-center gap-2 text-sm text-teal-700" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" />Back to rentals</button>
    <header><h2 className="break-words text-2xl font-semibold">{location.name}</h2><p className="mt-1 text-sm text-slate-500">{location.clients.join(", ")} · {location.rentals.length} {location.rentals.length === 1 ? "rental" : "rentals"}</p></header>
    <GmeaRentalFinancialSummary summary={location.summary} label="Location payment and expense totals" />
    <GmeaRentalTransactions state={transactions} operations={operations} rentals={rentals} canEdit={canEdit} />
  </section>;
}
