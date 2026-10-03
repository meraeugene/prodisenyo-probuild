export function formatBudgetInput(value: string) {
  const normalized = value.replaceAll(",", "").replace(/[^\d.]/g, "");
  const [whole = "", ...decimalParts] = normalized.split(".");
  const decimal = decimalParts.join("").slice(0, 2);
  const formattedWhole = whole.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return normalized.includes(".") ? `${formattedWhole || "0"}.${decimal}` : formattedWhole;
}
