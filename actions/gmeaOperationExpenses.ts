"use server";

import { revalidatePath } from "next/cache";
import { APP_ROLES, requireRole } from "@/lib/auth";
import { getGmeaOperationExpenses } from "@/features/gmea-operation-expenses/server/operationExpensesQueries";
import { operationExpensesWriter } from "@/features/gmea-operation-expenses/server/operationExpensesDatabase";
import { normalizeOperationExpenseInput } from "@/features/gmea-operation-expenses/utils/operationExpenseValidation";
import { rememberGmeaInputOptions } from "./utils/rememberGmeaInputOptions";

export async function getGmeaOperationExpensesAction() { return getGmeaOperationExpenses(); }

export async function saveGmeaOperationExpenseAction(version: number | null, input: unknown) {
  const { user } = await requireRole(APP_ROLES.GMEA);
  const value = normalizeOperationExpenseInput(input);
  const db = operationExpensesWriter();
  if (version !== null && (!Number.isInteger(version) || version < 1)) throw new Error("Reload this expense before saving.");
  await rememberGmeaInputOptions({ supplier: value.payee, method: value.method });
  const result = version === null
    ? await db.from("gmea_operation_expenses").insert({ ...value, created_by: user.id, updated_by: user.id }).select("id").single()
    : await db.from("gmea_operation_expenses").update({ ...value, version: version + 1, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq("id", value.id).eq("version", version).select("id").maybeSingle();
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw new Error("This operation expense changed. Reload before saving.");
  revalidatePath("/gmea-operation-expenses");
  revalidatePath("/gmea-dashboard");
  return result.data.id;
}
