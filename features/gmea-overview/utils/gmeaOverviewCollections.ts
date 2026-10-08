import { contractCollectionSummary, sumMoney } from "@/features/gmea-projects/utils/gmeaCalculations";
import { paidRevenue } from "@/features/gmea-rentals/utils/rentalAnalytics";
import { buildRentalAmounts } from "@/features/gmea-rentals/utils/rentalRecordSelectors";
import type { GmeaOverviewData } from "../types";

export function buildGmeaOverviewCollections(data: GmeaOverviewData) {
  const projectCollections = data.projects.map(contractCollectionSummary);
  const rentalBalances = data.rentals.rentals
    .filter((rental) => rental.status !== "cancelled")
    .map((rental) => buildRentalAmounts({
      ...rental,
      payments: data.rentals.payments.filter((payment) => payment.rental_id === rental.id),
    }).outstanding);

  return {
    totalCollected: sumMoney([
      ...projectCollections.map((collection) => collection.received),
      paidRevenue(data.rentals.payments),
    ]),
    notCollected: sumMoney([
      ...projectCollections.map((collection) => collection.outstanding),
      ...rentalBalances,
    ]),
  };
}
