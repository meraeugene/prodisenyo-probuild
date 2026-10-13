import "server-only";
import { requireGmeaRentalsAccess } from "./gmeaRentalsQueries";
import { gmeaRentalsReader } from "./gmeaRentalsDatabase";
import { readAllRentalRows } from "./readAllRentalRows";
import { mapCustomerIncomeEntry } from "../utils/customerIncomeMappers";

export async function getCustomerRentalIncome() {
  await requireGmeaRentalsAccess();
  const db = await gmeaRentalsReader();
  const rows = await readAllRentalRows(async (from, to) => {
    const result = await db.from("gmea_rental_customer_income").select("*").order("created_at").order("id").range(from, to);
    // Keep existing workbook data readable while the additive migration is deployed.
    if (result.error && ["42P01", "PGRST205"].includes(result.error.code)) return { data: [], error: null };
    return result;
  }, "customer rental income");
  return rows.map(mapCustomerIncomeEntry);
}
