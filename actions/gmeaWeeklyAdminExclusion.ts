// Local maintenance only. Removes source-verified admin rows from the prior import.
import type { SupabaseClient } from "@supabase/supabase-js";
import { validEquipmentId } from "@/features/gmea-rentals/utils/equipmentValidation";

type AdminExclusion = { id: string; version: number; notes: string; supplier: string; description: string };

export async function excludeImportedWeeklyAdminExpensesAction(
  db: SupabaseClient, actor: string, rows: AdminExclusion[], onApplied: (id: string) => void,
) {
  validEquipmentId(actor);
  const { data: profile, error } = await db.from("profiles").select("role,is_active").eq("id", actor).single();
  if (error || profile?.role !== "gmea" || !profile.is_active) throw new Error("An active GMEA account is required.");
  for (const row of rows) {
    validEquipmentId(row.id);
    if (!Number.isInteger(row.version) || row.version < 1 || !/ADMIN|MARIEGEN|MAEIEGEN/i.test(row.supplier)
      || !/source: [^;]+WEEK[^;]+:weekly-/i.test(row.notes) || !/^(Cash Advance|Salary|13th Month) - /i.test(row.description)) {
      throw new Error("Only source-verified imported admin expenses may be excluded.");
    }
  }
  for (const row of rows) {
    const { data: current, error: readError } = await db.from("gmea_rental_expenses").select("notes,supplier,description,version").eq("id", row.id).single();
    if (readError || !current || current.notes !== row.notes || current.supplier !== row.supplier || current.description !== row.description || current.version !== row.version) {
      throw new Error("An admin expense changed after review. Reload before excluding it.");
    }
    const { data, error: deleteError } = await db.rpc("mutate_gmea_rental_expense", {
      p_actor: actor, p_expense: row.id, p_version: row.version, p_command: { kind: "delete" },
    });
    if (deleteError || data !== row.id) throw new Error(deleteError?.message || "Unable to exclude imported admin expense.");
    onApplied(data);
  }
}
