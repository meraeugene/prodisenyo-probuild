import "server-only";
import { APP_ROLES, requireRole } from "@/lib/auth";
import { readAllRentalRows } from "@/features/gmea-rentals/server/readAllRentalRows";
import { operationExpensesReader } from "./operationExpensesDatabase";

export async function getGmeaOperationExpenses() {
  await requireRole([APP_ROLES.GMEA, APP_ROLES.CEO]);
  const db = await operationExpensesReader();
  const rows = await readAllRentalRows(async (from, to) => {
    const result = await db.from("gmea_operation_expenses").select("*").order("date", { ascending: false }).order("id").range(from, to);
    if (result.error && ["42P01", "PGRST205"].includes(result.error.code)) return { data: [], error: null };
    return result;
  }, "operation expenses");
  return rows.map(row => ({ ...row, amount: Number(row.amount) }));
}
