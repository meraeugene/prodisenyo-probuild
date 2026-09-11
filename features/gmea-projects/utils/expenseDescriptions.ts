export function parseExpenseDescriptions(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeExpenseDescriptions(value: string) {
  return parseExpenseDescriptions(value).join(", ");
}
