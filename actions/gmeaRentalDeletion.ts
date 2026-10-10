"use server";

import { revalidatePath } from "next/cache";
import { gmeaRentalsWriter } from "@/features/gmea-rentals/server/gmeaRentalsDatabase";
import { requireGmeaRentalsAccess } from "@/features/gmea-rentals/server/gmeaRentalsQueries";
import { validEquipmentId } from "@/features/gmea-rentals/utils/equipmentValidation";

export async function deleteGmeaRentalRecordAction(kind: "rental" | "equipment", id: string, version: number) {
  await requireGmeaRentalsAccess(true);
  if (kind !== "rental" && kind !== "equipment") throw new Error("Invalid record type.");
  validEquipmentId(id);
  if (!Number.isInteger(version) || version < 1) throw new Error("Reload this record before deleting.");
  const table = kind === "rental" ? "gmea_rentals" : "gmea_rental_equipment";
  // Compare the version in the delete itself so a newer edit cannot be removed.
  const { data, error } = await gmeaRentalsWriter().from(table).delete()
    .eq("id", id).eq("version", version).select("id").maybeSingle();
  if (error) {
    if (error.code === "23503" && kind === "equipment") {
      throw new Error("This equipment is linked to rental or expense records. Deactivate it instead, or remove its linked records first.");
    }
    throw new Error("Unable to delete this record. " + error.message);
  }
  if (!data) throw new Error("This record changed or was already deleted. Reload before trying again.");
  for (const path of ["/gmea-rentals", "/gmea-overview", "/gmea-rentals/dashboard", "/gmea-rentals/reports"]) revalidatePath(path);
  if (kind === "rental") revalidatePath(`/gmea-rentals/${id}`);
  return id;
}
