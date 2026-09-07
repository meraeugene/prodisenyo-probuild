/** Present project durations consistently while keeping descriptive values intact. */
export function formatProjectDuration(value: string | null | undefined): string {
  const duration = value?.trim() ?? "";
  if (!duration) return "Not set";
  const numeric = duration.match(/^(\d+(?:\.\d+)?)$/);
  if (numeric) return `${numeric[1]} Days`;
  const days = duration.match(/^(\d+(?:\.\d+)?)\s*days?$/i);
  if (days) return `${days[1]} Days`;
  return duration;
}

export function normalizeProjectDuration(value: string): string {
  return formatProjectDuration(value);
}
