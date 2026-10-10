// Local maintenance only; not exposed as a browser-callable action.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RentalExpenseMutation } from "@/features/gmea-rentals/types";
import { normalizeRentalExpenseMutation } from "@/features/gmea-rentals/utils/operationsValidation";
import { validEquipmentId } from "@/features/gmea-rentals/utils/equipmentValidation";

export type RentalWeeklyImportPlan = { id: string; version: number | null; source: string; command: RentalExpenseMutation };
export async function applyRentalWeeklyImportAction(db: SupabaseClient, actor: string, plans: RentalWeeklyImportPlan[], onApplied: (id: string, source: string) => void) {
  validEquipmentId(actor);
  const { data: profile, error: profileError } = await db.from("profiles").select("role,is_active").eq("id", actor).single();
  if (profileError || profile?.role !== "gmea" || !profile.is_active) throw new Error("An active GMEA account is required.");
  const commands = plans.map(plan => {
    validEquipmentId(plan.id);
    if (plan.command.kind === "delete" || (plan.command.kind === "update" && (!Number.isInteger(plan.version) || Number(plan.version) < 1))) throw new Error("Invalid weekly reconciliation operation.");
    return normalizeRentalExpenseMutation(plan.command);
  });
  for (let from = 0; from < plans.length; from += 6) {
    const results = await Promise.allSettled(plans.slice(from, from + 6).map(async (plan, offset) => {
      const { data, error } = await db.rpc("mutate_gmea_rental_expense", { p_actor: actor, p_expense: plan.version ? plan.id : null, p_version: plan.version, p_command: commands[from + offset] });
      if (error || data !== plan.id) throw new Error(`${plan.source}: ${error?.message || "Unexpected expense identifier"}`);
      onApplied(data, plan.source);
    }));
    const failed = results.find(result => result.status === "rejected");
    if (failed?.status === "rejected") throw failed.reason;
  }
}
