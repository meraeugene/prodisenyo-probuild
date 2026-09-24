import {
  EQUIPMENT_STATUSES,
  RATE_UNITS,
  type EquipmentInput,
  type EquipmentMutation,
} from "../types";

function text(value: unknown, label: string, required = false, max = 200) {
  if (typeof value !== "string") {
    if (!required && value == null) return "";
    throw new Error(label + " is invalid.");
  }
  const result = value.trim();
  if ((required && !result) || result.length > max)
    throw new Error(
      label + " is required and must be within " + max + " characters.",
    );
  return result;
}

export function validEquipmentId(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new Error("Invalid equipment identifier.");
  return value;
}

function details(value: unknown): EquipmentInput {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid equipment.");
  const input = value as Record<string, unknown>;
  const defaultRate =
    input.default_rate == null || input.default_rate === ""
      ? null
      : Number(input.default_rate);
  if (
    defaultRate !== null &&
    (!Number.isFinite(defaultRate) || defaultRate < 0 || defaultRate > 1e10)
  )
    throw new Error("Default rate must be a valid nonnegative amount.");
  const rateUnit =
    input.rate_unit == null || input.rate_unit === ""
      ? null
      : String(input.rate_unit);
  if (
    rateUnit !== null &&
    !RATE_UNITS.includes(rateUnit as (typeof RATE_UNITS)[number])
  )
    throw new Error("Select a valid default rate type.");
  const status = text(input.status, "Status", true, 30).toLowerCase();
  if (
    !EQUIPMENT_STATUSES.includes(status as (typeof EQUIPMENT_STATUSES)[number])
  )
    throw new Error("Select a valid equipment status.");
  const isActive = status === "inactive" ? false : input.is_active !== false;
  return {
    code: text(input.code, "Asset code", true, 100),
    name: text(input.name, "Equipment name", true, 200),
    equipment_type: text(input.equipment_type, "Equipment type", true, 100),
    plate_number: text(input.plate_number, "Plate number", false, 100),
    default_rate:
      defaultRate === null ? null : Math.round(defaultRate * 100) / 100,
    rate_unit: rateUnit as EquipmentInput["rate_unit"],
    notes: text(input.notes, "Notes", false, 2000),
    status: status as EquipmentInput["status"],
    is_active: isActive,
  };
}

export function normalizeEquipmentMutation(input: unknown): EquipmentMutation {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid equipment operation.");
  const command = input as Record<string, unknown>;
  if (command.kind === "deactivate") return { kind: "deactivate" };
  if (command.kind === "create" || command.kind === "update")
    return { kind: command.kind, value: details(command.value) };
  throw new Error("Invalid equipment operation.");
}
