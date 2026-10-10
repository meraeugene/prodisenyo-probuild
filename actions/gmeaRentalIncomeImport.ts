import type { SupabaseClient } from "@supabase/supabase-js";
import type { RentalIncomeImport } from "@/features/gmea-rentals/incomeTypes";

/** Maintenance import only: supplied service client, no browser-callable action. */
export async function importGmeaCustomerIncomeAction(db: SupabaseClient, actor: string, batch: RentalIncomeImport) {
  const ids = new Set<string>();
  const receiptIds = new Set<string>();
  if (!/^[0-9a-f]{64}$/.test(batch.source_hash) || batch.parser_version !== 1 || !batch.records.length) throw new Error("Invalid import metadata.");
  for (const record of batch.records) {
    if (!record.client.trim() || ids.has(record.id)) throw new Error("Missing client or duplicate income record.");
    ids.add(record.id);
    for (const receipt of record.receipts) {
      if (receiptIds.has(receipt.id) || !Number.isFinite(receipt.amount) || receipt.amount <= 0
        || (receipt.confirmed && !/^\d{4}-\d{2}-\d{2}$/.test(receipt.date ?? ""))) throw new Error("Invalid or duplicate income receipt.");
      receiptIds.add(receipt.id);
    }
  }
  const {data,error} = await db.rpc("import_gmea_customer_income", {p_actor:actor,p_batch:batch});
  if (error) throw new Error(error.message);
  return data as string;
}
