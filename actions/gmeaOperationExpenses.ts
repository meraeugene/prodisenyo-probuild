"use server";

import { revalidatePath } from "next/cache";
import { APP_ROLES, requireRole } from "@/lib/auth";
import { getGmeaOperationExpenses } from "@/features/gmea-operation-expenses/server/operationExpensesQueries";
import { operationExpensesWriter } from "@/features/gmea-operation-expenses/server/operationExpensesDatabase";
import { normalizeOperationExpenseInput } from "@/features/gmea-operation-expenses/utils/operationExpenseValidation";
import { rememberGmeaInputOptions } from "./utils/rememberGmeaInputOptions";
import { validEquipmentId } from "@/features/gmea-rentals/utils/equipmentValidation";

export async function getGmeaOperationExpensesAction() { return getGmeaOperationExpenses(); }

export async function deleteGmeaOperationExpenseAction(id: string, version: number) {
  await requireRole(APP_ROLES.GMEA);
  validEquipmentId(id);
  if (!Number.isInteger(version) || version < 1) throw new Error("Reload this expense before deleting.");
  const { data, error } = await operationExpensesWriter().from("gmea_operation_expenses").delete()
    .eq("id", id).eq("version", version).select("id").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("This operation expense changed or was already deleted. Reload before trying again.");
  revalidatePath("/gmea-operation-expenses"); revalidatePath("/gmea-dashboard");
  return id;
}

export async function saveGmeaOperationExpenseAction(version: number | null, input: unknown) {
  const { user } = await requireRole(APP_ROLES.GMEA);
  const value = normalizeOperationExpenseInput(input);
  const db = operationExpensesWriter();
  if (version !== null && (!Number.isInteger(version) || version < 1)) throw new Error("Reload this expense before saving.");
  await rememberGmeaInputOptions({ supplier: value.payee, method: value.method });
  let result = version === null
    ? await db.from("gmea_operation_expenses").insert({ ...value, created_by: user.id, updated_by: user.id }).select("*").single()
    : await db.from("gmea_operation_expenses").update({ ...value, version: version + 1, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq("id", value.id).eq("version", version).select("*").maybeSingle();
  let alreadyAdded = false;
  if (version === null && result.error?.code === "23505") {
    const existing = await db.from("gmea_operation_expenses").select("*").eq("id", value.id).eq("created_by", user.id).maybeSingle();
    const saved = existing.data;
    if (!existing.error && saved && Object.entries(value).every(([key, inputValue]) =>
      key === "amount" ? Number(saved.amount) === inputValue : saved[key as keyof typeof saved] === inputValue)) {
      result = existing; alreadyAdded = true;
    }
  }
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw new Error("This operation expense changed. Reload before saving.");
  revalidatePath("/gmea-operation-expenses");
  revalidatePath("/gmea-dashboard");
  return { ...result.data, amount: Number(result.data.amount), alreadyAdded };
}
