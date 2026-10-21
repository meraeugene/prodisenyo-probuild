// Local maintenance only. Version-checked removal of superseded workbook imports.
import type { SupabaseClient } from "@supabase/supabase-js";
import { validEquipmentId } from "@/features/gmea-rentals/utils/equipmentValidation";

type ImportedExpense = { id: string; version: number; notes: string; rental_id: string | null; income_record_id?: string | null; amount: number | string; expense_date: string };

export async function excludeNonWeeklyWorkbookExpensesAction(
  db: SupabaseClient, actor: string, rows: ImportedExpense[], onApplied: (id: string) => void,
) {
  validEquipmentId(actor);
  const { data: profile, error } = await db.from("profiles").select("role,is_active").eq("id", actor).single();
  if (error || profile?.role !== "gmea" || !profile.is_active) throw new Error("An active GMEA account is required.");
  for (const row of rows) {
    validEquipmentId(row.id);
    if (row.rental_id || row.income_record_id || !Number.isInteger(row.version) || row.version < 1
      || !/source: [^;\n]+:(?:monthly-equipment|weekly-[a-z-]+)/.test(row.notes)
      || !/Historical import;|Weekly workbook import;/.test(row.notes)) throw new Error("Only source-verified workbook imports may be excluded.");
  }
  for (let from = 0; from < rows.length; from += 6) {
    const results = await Promise.allSettled(rows.slice(from, from + 6).map(async row => {
      const { data: current, error: readError } = await db.from("gmea_rental_expenses")
        .select("notes,rental_id,income_record_id,amount,expense_date,version").eq("id", row.id).single();
      if (readError || !current || current.notes !== row.notes || current.version !== row.version || current.rental_id || current.income_record_id
        || Number(current.amount) !== Number(row.amount) || current.expense_date !== row.expense_date) throw new Error("An imported expense changed after review.");
      const { data, error: deleteError } = await db.rpc("mutate_gmea_rental_expense", {
        p_actor: actor, p_expense: row.id, p_version: row.version, p_command: { kind: "delete" },
      });
      if (deleteError || data !== row.id) throw new Error(deleteError?.message || "Unable to exclude workbook expense.");
      onApplied(data);
    }));
    const failure = results.find(result => result.status === "rejected");
    if (failure?.status === "rejected") throw failure.reason;
  }
}
