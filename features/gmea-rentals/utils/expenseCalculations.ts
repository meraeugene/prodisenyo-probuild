import type { RentalVatMode } from "../types";

function money(value: number) {
  return Math.round(value * 100) / 100;
}

export function rentalVatBreakdown(
  amount: number,
  mode: RentalVatMode,
  rate: number,
) {
  if (
    amount < 0 ||
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 100 ||
    !["off", "inclusive", "exclusive"].includes(mode) ||
    (mode !== "off" && rate <= 0)
  ) {
    throw new Error("Enter a valid amount and VAT rate.");
  }
  const normalized = money(amount);
  const base =
    mode === "inclusive" ? money(normalized / (1 + rate / 100)) : normalized;
  const vat =
    mode === "off"
      ? 0
      : mode === "inclusive"
        ? money(normalized - base)
        : money((base * rate) / 100);
  return { base, vat, gross: money(base + vat) };
}
