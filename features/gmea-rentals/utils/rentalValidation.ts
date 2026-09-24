import {
  RATE_UNITS,
  RENTAL_STATUSES,
  type CreateRentalInput,
  type RentalMutation,
} from "../types";
import { validEquipmentId } from "./equipmentValidation";

function text(value: unknown, label: string, required = false, max = 500) {
  if (typeof value !== "string") throw new Error(label + " is invalid.");
  const result = value.trim();
  if ((required && !result) || result.length > max)
    throw new Error(
      label + " is required and must be within " + max + " characters.",
    );
  return result;
}
function date(value: unknown, label: string) {
  const result = text(value, label, true, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(Date.parse(result)))
    throw new Error("Enter a valid " + label.toLowerCase() + ".");
  return result;
}
function money(value: unknown, label: string) {
  const result = Number(value);
  if (!Number.isFinite(result) || result < 0 || result > 1e10)
    throw new Error(label + " must be a valid nonnegative number.");
  return Math.round(result * 100) / 100;
}

export function normalizeRentalMutation(input: unknown): RentalMutation {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid rental operation.");
  const command = input as Record<string, unknown>;
  if (
    command.kind !== "create" ||
    !command.value ||
    typeof command.value !== "object" ||
    Array.isArray(command.value)
  )
    throw new Error("Invalid rental operation.");
  const value = command.value as Record<string, unknown>;
  const start = date(value.start_date, "Start date"),
    end = date(value.end_date, "End date");
  if (end < start) throw new Error("End date cannot be before start date.");
  const status = text(value.status, "Status", true, 30);
  if (!RENTAL_STATUSES.includes(status as (typeof RENTAL_STATUSES)[number]))
    throw new Error("Select a valid rental status.");
  if (
    !Array.isArray(value.items) ||
    value.items.length < 1 ||
    value.items.length > 100
  )
    throw new Error("Add between 1 and 100 equipment items.");
  const items = value.items.map((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
      throw new Error("Invalid equipment item.");
    const row = raw as Record<string, unknown>,
      rateType = String(row.rate_type);
    if (!RATE_UNITS.includes(rateType as (typeof RATE_UNITS)[number]))
      throw new Error("Select a rate type for every equipment item.");
    const quantity = rateType === "fixed" ? 1 : Number(row.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1e8)
      throw new Error("Billable quantity must be greater than zero.");
    return {
      id: validEquipmentId(row.id),
      equipment_id: validEquipmentId(row.equipment_id),
      rate_type: rateType as CreateRentalInput["items"][number]["rate_type"],
      unit_rate: money(row.unit_rate, "Unit rate"),
      quantity: Math.round(quantity * 100) / 100,
    };
  });
  if (new Set(items.map((item) => item.equipment_id)).size !== items.length)
    throw new Error("Each equipment unit can only appear once per rental.");
  return {
    kind: "create",
    value: {
      rental_number: text(value.rental_number, "Rental number", true, 100),
      client: text(value.client, "Client", true, 200),
      location: text(value.location, "Location", true, 300),
      start_date: start,
      end_date: end,
      notes: text(value.notes, "Notes", false, 2000),
      status: status as CreateRentalInput["status"],
      items,
    },
  };
}
