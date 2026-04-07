export function extractDashboardBranchName(value: string): string {
  if (!value) return "";
  return value.trim().split(/\s+/)[0].toUpperCase();
}

export function formatCompactDashboardCurrency(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (absolute >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (absolute >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString("en-PH");
}

export function roundDashboardValue(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatDashboardTrendPercent(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}
