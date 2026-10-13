import type { GmeaInputOptions, GmeaSavedOptionField } from "../types";

export const defaultGmeaInputOptions: GmeaInputOptions = {
  methods: ["Cash", "GCash", "Cheque", "Bank transfer", "Online transfer"],
  suppliers: ["Drivers", "Operators", "Admin", "GMEA Admin"],
  invoiceNames: ["GMEA MARKETING CORP.", "Prodisenyo Builders Corp."], clients: [], locations: [], services: [],
};
export function mergeGmeaInputValues(...lists: string[][]) {
  const values = new Map<string, string>();
  for (const value of lists.flat()) {
    if (typeof value !== "string") continue;
    const normalized = value.trim().replace(/\s+/g, " ");
    if (normalized && !values.has(normalized.toLocaleLowerCase())) values.set(normalized.toLocaleLowerCase(), normalized);
  }
  return [...values.values()].sort((left, right) => left.localeCompare(right));
}
export function normalizeGmeaSavedOptions(input: Partial<Record<GmeaSavedOptionField, string>>) {
  return Object.entries(input).map(([field, value]) => {
    if (!["method", "supplier", "invoice_name"].includes(field) || typeof value !== "string") throw new Error("Invalid saved input option.");
    const normalized = value.trim().replace(/\s+/g, " ");
    if (normalized.length > (field === "method" ? 100 : 200)) throw new Error("Saved input value is too long.");
    return { field: field as GmeaSavedOptionField, value: normalized };
  }).filter(row => row.value);
}
