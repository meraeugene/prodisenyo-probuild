// Local maintenance entry point. Not exposed as a browser-callable server action.
// Uses the existing role-checked RPCs; held workbook rows are never sent to them.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EquipmentInput } from "@/features/gmea-rentals/types";
import { normalizeEquipmentMutation, validEquipmentId } from "@/features/gmea-rentals/utils/equipmentValidation";
import { normalizeRentalExpenseMutation } from "@/features/gmea-rentals/utils/operationsValidation";
import type { RentalWorkbookPlan } from "@/features/gmea-rentals/utils/rentalWorkbookImport";

type RentalImportDb = SupabaseClient;
async function requireImportActor(db: RentalImportDb, actor: string) {
  validEquipmentId(actor);
  const { data, error } = await db.from("profiles").select("id,role,is_active").eq("id", actor).single();
  const profile = data as { role?: string; is_active?: boolean } | null;
  if (error || profile?.role !== "gmea" || !profile.is_active) throw new Error("Only an active GMEA account can import rental expenses.");
}

export async function createRentalWorkbookEquipmentAction(db: RentalImportDb, actor: string, values: EquipmentInput[], onApplied: (id: string, name: string) => void) {
  await requireImportActor(db, actor);
  const commands = values.map(value => normalizeEquipmentMutation({ kind: "create", value }));
  for (let index = 0; index < commands.length; index++) {
    const { data, error } = await db.rpc("mutate_gmea_rental_equipment", { p_actor: actor, p_equipment: null, p_version: null, p_command: commands[index] });
    if (error || !data) throw new Error(`Unable to import equipment ${values[index].name}: ${error?.message || "No equipment returned"}`);
    onApplied(data, values[index].name);
  }
}

export async function applyRentalWorkbookExpensesAction(db: RentalImportDb, actor: string, plans: RentalWorkbookPlan[], onApplied: (id: string, source: string) => void) {
  await requireImportActor(db, actor);
  // Validate the entire batch before the first financial write.
  const commands = plans.map(plan => {
    if (plan.record.issues.length) throw new Error(`Held expense: ${plan.record.sourceLocator}`);
    return normalizeRentalExpenseMutation(plan.command);
  });
  for (let from = 0; from < plans.length; from += 6) {
    const results = await Promise.allSettled(plans.slice(from, from + 6).map(async (plan, offset) => {
      const { data, error } = await db.rpc("mutate_gmea_rental_expense", { p_actor: actor, p_expense: null, p_version: null, p_command: commands[from + offset] });
      if (error || data !== plan.record.id) throw new Error(`${plan.record.sourceLocator}: ${error?.message || "Unexpected expense identifier"}`);
      onApplied(data, plan.record.sourceLocator);
    }));
    const failed = results.find(result => result.status === "rejected");
    if (failed?.status === "rejected") throw failed.reason;
  }
}

export async function markRentalWorkbookNotificationsReadAction(db: RentalImportDb, actor: string, expenseIds: string[]) {
  await requireImportActor(db, actor);
  expenseIds.forEach(validEquipmentId);
  for (let from = 0; from < expenseIds.length; from += 100) {
    const { error } = await db.from("gmea_rental_expense_notifications").update({ read_at: new Date().toISOString() })
      .in("expense_id", expenseIds.slice(from, from + 100)).is("read_at", null);
    if (error) throw new Error(`Unable to mark historical notifications read: ${error.message}`);
  }
}
