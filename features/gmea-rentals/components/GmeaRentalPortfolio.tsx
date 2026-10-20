"use client";

import { useMemo, useState } from "react";
import type { GmeaRental, RentalOperationsData } from "../types";
import type { RentalIncomeRecord } from "../incomeTypes";
import { buildRentalLocations, summarizeRentalPortfolio } from "../utils/rentalPortfolioSelectors";
import GmeaRentalFinancialSummary from "./GmeaRentalFinancialSummary";
import GmeaRentalLocationDetails from "./GmeaRentalLocationDetails";
import GmeaRentalTransactions from "./GmeaRentalTransactions";
import { useRentalTransactions } from "../hooks/useRentalTransactions";

export default function GmeaRentalPortfolio({ rentals, historicalIncome, operations, canEdit }: {
  rentals: GmeaRental[]; historicalIncome: RentalIncomeRecord[]; operations: RentalOperationsData; canEdit: boolean;
}) {
  const records = useMemo(() => [...rentals, ...historicalIncome], [rentals, historicalIncome]);
  const locations = useMemo(() => buildRentalLocations(records, operations.expenses), [records, operations.expenses]);
  const summary = useMemo(() => summarizeRentalPortfolio(records, operations.expenses), [records, operations.expenses]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selected = locations.find(location => location.key === selectedKey);
  const transactions = useRentalTransactions(records, operations.expenses);

  if (selected) return <GmeaRentalLocationDetails key={selected.key} location={selected} operations={operations}
    rentals={rentals} canEdit={canEdit} onBack={() => setSelectedKey(null)} />;

  return <div className="space-y-4">
    <GmeaRentalFinancialSummary summary={summary} label="Overall rental payment and expense totals" />
    <GmeaRentalTransactions state={transactions} operations={operations} rentals={rentals} canEdit={canEdit}
      onLocation={record => setSelectedKey(locations.find(location => location.rentals.some(row => row.id === record.id))?.key || null)} />
  </div>;
}
