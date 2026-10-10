import type { EquipmentInput, RentalExpenseCategory, RentalExpenseMutation } from "../types";
import { normalizeEquipmentMutation, validEquipmentId } from "./equipmentValidation";
import { normalizeRentalExpenseMutation } from "./operationsValidation";

export type RentalWorkbookRecord = {
  id: string; date: string; amount: number; equipment: string | null; category: string;
  rawDescription: string; payee: string; sourceLocator: string; sourceFingerprint: string;
  issues: string[]; sheet: string; address: string;
};
export type RentalImportEquipment = { id: string; name: string; code: string };
export type RentalWorkbookPlan = { record: RentalWorkbookRecord; command: RentalExpenseMutation };

export const normalizeRentalEquipmentName = (name: string) => name.trim().toUpperCase()
  .replace(/[^A-Z0-9&]+/g, " ").replace(/\bTRUCK\b/g, "").replace(/\s+/g, " ").trim();

export function rentalWorkbookEquipmentInputs(records: RentalWorkbookRecord[], existing: RentalImportEquipment[]): EquipmentInput[] {
  const names = new Set(existing.map(item => normalizeRentalEquipmentName(item.name)));
  const missing = [...new Set(records.map(record => record.equipment).filter((name): name is string => !!name))]
    .filter(name => !names.has(normalizeRentalEquipmentName(name)));
  return missing.map(name => {
    const value = { code: `HIST-${name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
      name, equipment_type: "Other", plate_number: "", default_rate: null, rate_unit: null,
      notes: "Equipment named in ALL EXPENSES (1).xlsx. Historical costs only; current availability not confirmed.",
      status: "inactive" as const, is_active: false };
    if (existing.some(item => item.code.toUpperCase() === value.code)) throw new Error(`Equipment code already belongs to another name: ${value.code}`);
    const command = normalizeEquipmentMutation({ kind: "create", value });
    if (command.kind !== "create") throw new Error("Invalid equipment import.");
    return command.value;
  });
}

export function buildRentalWorkbookExpensePlans(records: RentalWorkbookRecord[], categories: RentalExpenseCategory[], equipment: RentalImportEquipment[]): RentalWorkbookPlan[] {
  const ids = new Set<string>(), locators = new Set<string>();
  return records.map(record => {
    if (record.issues.length) throw new Error(`Held record cannot be imported: ${record.sourceLocator}`);
    validEquipmentId(record.id);
    if (!/^[a-f0-9]{64}$/.test(record.sourceFingerprint) || !record.sourceLocator || record.sourceLocator.length > 250) throw new Error("Invalid workbook provenance.");
    if (ids.has(record.id) || locators.has(record.sourceLocator)) throw new Error("Duplicate record in import plan.");
    ids.add(record.id); locators.add(record.sourceLocator);
    const matches = categories.filter(item => item.is_active && item.name.toUpperCase() === record.category.toUpperCase());
    if (matches.length !== 1) throw new Error(`Expense category cannot be resolved: ${record.category}`);
    const assets = record.equipment ? equipment.filter(item => normalizeRentalEquipmentName(item.name) === normalizeRentalEquipmentName(record.equipment!)) : [];
    if (record.equipment && assets.length !== 1) throw new Error(`Equipment cannot be resolved: ${record.equipment}`);
    const date = new Date(`${record.date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== record.date) throw new Error(`Invalid source expense date: ${record.sourceLocator}`);
    const command = normalizeRentalExpenseMutation({ kind: "create", value: {
      id: record.id, rental_id: null, equipment_id: assets[0]?.id ?? null, category_id: matches[0].id,
      date: record.date, description: record.rawDescription || `Workbook expense (${record.category})`, supplier: record.payee || "",
      method: "", invoice_number: "", amount: record.amount, refunded_amount: 0, vat_mode: "off", vat_rate: 0, version: 1,
      notes: `Historical import; source: ${record.sourceLocator}; source-fingerprint:${record.sourceFingerprint}`,
    } });
    return { record, command };
  });
}
