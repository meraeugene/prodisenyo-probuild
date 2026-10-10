import "server-only";
import { requireGmeaRentalsAccess } from "./gmeaRentalsQueries";
import { gmeaRentalsReader } from "./gmeaRentalsDatabase";
import { readAllRentalRows } from "./readAllRentalRows";
import { mapHistoricalIncomeRecords } from "../utils/historicalIncomeMappers";

export async function getHistoricalRentalIncome() {
  await requireGmeaRentalsAccess();
  const db = await gmeaRentalsReader();
  const imports = await readAllRentalRows((from,to)=>db.from("gmea_rental_income_imports")
    .select("*").order("imported_at").order("source_hash").range(from,to), "historical rental income");
  return imports.flatMap(row=>mapHistoricalIncomeRecords(row.records,row.imported_at,row.imported_by));
}
