"use server";
import { revalidatePath } from "next/cache";
import { requireGmeaRentalsAccess } from "@/features/gmea-rentals/server/gmeaRentalsQueries";
import { gmeaRentalsWriter } from "@/features/gmea-rentals/server/gmeaRentalsDatabase";
import { normalizeRentalIncomeRecordEdit } from "@/features/gmea-rentals/utils/rentalIncomeRecordEditing";
import { validEquipmentId } from "@/features/gmea-rentals/utils/equipmentValidation";
import { deleteGmeaRentalRecordAction } from "./gmeaRentalDeletion";

async function mutateIncome(input: unknown, remove: boolean) {
  const { user } = await requireGmeaRentalsAccess(true);
  const value = normalizeRentalIncomeRecordEdit(input), db = gmeaRentalsWriter();
  if (value.origin === "historical") {
    const current = await db.from("gmea_rental_income_imports").select("source_hash,records")
      .contains("records", JSON.stringify([{ id: value.id }])).maybeSingle();
    if (current.error) throw new Error(current.error.message);
    const imported = current.data, original = imported?.records.find(row => row.id === value.id && !row.deleted);
    if (!imported || !original || (original.revision ?? 1) !== value.version) throw new Error("This income record changed or was deleted. Reload before trying again.");
    const collected = original.receipts.filter(receipt => receipt.confirmed).reduce((sum, receipt) => sum + Math.round(receipt.amount * 100), 0);
    if (!remove && value.charge !== original.charge && value.charge !== null && Math.round(value.charge * 100) < collected) throw new Error("The rental amount cannot be less than confirmed payments.");
    const audit = { revision: value.version + 1, updatedBy: user.id, updatedAt: new Date().toISOString() };
    const records = imported.records.map(row => row.id !== value.id ? row : remove
      ? { ...row, deleted: true, ...audit }
      : { ...row, client: value.client, location: value.location, service: value.service, charge: value.charge, ...audit });
    // Keep the immutable source snapshot, source rows, receipts, and import timestamp.
    // A small bundle token makes concurrent edits atomic without a large JSON URL filter.
    const importRevision = imported.records[0]?.importRevision;
    records[0] = { ...records[0], importRevision: crypto.randomUUID() };
    let query = db.from("gmea_rental_income_imports").update({ records }).eq("source_hash", imported.source_hash);
    query = importRevision ? query.eq("records->0->>importRevision", importRevision) : query.is("records->0->>importRevision", null);
    const result = await query.select("source_hash").maybeSingle();
    if (result.error) throw new Error(result.error.message);
    if (!result.data) throw new Error("This income import changed. Reload before trying again.");
  } else if (value.origin === "customer") {
    validEquipmentId(value.id);
    const current = await db.from("gmea_rental_customer_income").select("*").eq("id", value.id).maybeSingle();
    if (current.error) throw new Error(current.error.message);
    if (!current.data || current.data.version !== value.version) throw new Error("This income record changed or was deleted. Reload before trying again.");
    const collected = current.data.payments.filter(payment => payment.status === "posted").reduce((sum, payment) => sum + Math.round(payment.amount * 100), 0);
    if (!remove && Math.round(Number(value.charge) * 100) < collected) throw new Error("The rental amount cannot be less than received payments.");
    const query = remove ? db.from("gmea_rental_customer_income").delete() : db.from("gmea_rental_customer_income").update({
      client: value.client, location: value.location, service: value.service, total_amount: Number(value.charge), version: value.version + 1, updated_at: new Date().toISOString() });
    const result = await query.eq("id", value.id).eq("version", value.version).select("id").maybeSingle();
    if (result.error) throw new Error(result.error.message);
    if (!result.data) throw new Error("This income record changed. Reload before trying again.");
  } else {
    validEquipmentId(value.id);
    if (remove) await deleteGmeaRentalRecordAction("rental", value.id, value.version);
    else {
      const result = await db.from("gmea_rentals").update({ customer_name: value.client, site_location: value.location,
        version: value.version + 1, updated_at: new Date().toISOString() }).eq("id", value.id).eq("version", value.version).select("id").maybeSingle();
      if (result.error) throw new Error(result.error.message);
      if (!result.data) throw new Error("This rental changed. Reload before saving.");
    }
  }
  revalidatePath("/gmea-rentals", "layout"); revalidatePath("/gmea-dashboard");
  return value.id;
}
export async function editGmeaRentalIncomeRecordAction(input: unknown) { return mutateIncome(input, false); }
export async function deleteGmeaRentalIncomeRecordAction(input: unknown) { return mutateIncome(input, true); }
