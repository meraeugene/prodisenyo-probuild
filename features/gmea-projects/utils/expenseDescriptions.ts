export function parseExpenseDescriptions(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeExpenseDescriptions(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean).join(", ");
}
