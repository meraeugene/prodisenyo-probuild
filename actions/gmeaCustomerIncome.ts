"use server";

import { revalidatePath } from "next/cache";
import { requireGmeaRentalsAccess } from "@/features/gmea-rentals/server/gmeaRentalsQueries";
import { gmeaRentalsWriter } from "@/features/gmea-rentals/server/gmeaRentalsDatabase";
import { normalizeCustomerIncomeInput } from "@/features/gmea-rentals/utils/customerIncomeValidation";
import { normalizeRentalExpenseMutation } from "@/features/gmea-rentals/utils/operationsValidation";
import { rememberGmeaInputOptions } from "./utils/rememberGmeaInputOptions";

export async function saveCustomerRentalIncomeAction(input: unknown) {
  const { user } = await requireGmeaRentalsAccess(true);
  const normalized = normalizeCustomerIncomeInput(input);
  await rememberGmeaInputOptions({ method: normalized.method });
  const { data, error } = await gmeaRentalsWriter().rpc("save_gmea_customer_income", { p_actor: user.id, p_input: normalized });
  if (error) throw new Error(error.message);
  revalidatePath("/gmea-rentals", "layout");
  revalidatePath("/gmea-dashboard");
  return data;
}

export async function createCustomerRentalExpenseAction(recordId: string, input: unknown) {
  const { user } = await requireGmeaRentalsAccess(true);
  if (typeof recordId !== "string" || !recordId.trim() || recordId.length > 200) throw new Error("Select a valid rental income record.");
  const normalized = normalizeRentalExpenseMutation(input);
  if (normalized.kind !== "create") throw new Error("Use the expense editor to update an existing expense.");
  await rememberGmeaInputOptions({ supplier: normalized.value.supplier, method: normalized.value.method });
  const { data, error } = await gmeaRentalsWriter().rpc("create_gmea_customer_expense", {
    p_actor: user.id, p_record: recordId, p_command: normalized,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/gmea-rentals", "layout");
  revalidatePath("/gmea-dashboard");
  return data;
}
