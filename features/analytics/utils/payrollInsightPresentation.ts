export const THEME_BRANCH_COLORS = [
  "rgb(var(--theme-chart-1))",
  "rgb(var(--theme-chart-2))",
  "rgb(var(--theme-chart-3))",
  "rgb(var(--theme-chart-4))",
  "rgb(var(--theme-chart-5))",
  "rgb(var(--theme-chart-2))",
  "rgb(var(--theme-chart-3))",
  "rgb(var(--theme-chart-4))",
  "rgb(var(--theme-chart-5))",
  "rgb(var(--theme-chart-1))",
];

export const PIE_CHART_COLORS = THEME_BRANCH_COLORS;

export const STACK_COLORS = {
  regular: "rgb(var(--theme-chart-2))",
  overtime: "rgb(var(--theme-chart-3))",
  allowance: "rgb(var(--theme-chart-5))",
};

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactCurrency(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (absolute >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (absolute >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("en-PH");
}

export function shorten(value: string, max = 16): string {
  if (!value) return "";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

export function extractBranchName(value: string): string {
  if (!value) return "";
  return value.trim().split(/\s+/)[0].toUpperCase();
}

export function getBranchColor(index: number) {
  return THEME_BRANCH_COLORS[index % THEME_BRANCH_COLORS.length];
}

export function getPieColor(index: number) {
  return PIE_CHART_COLORS[index % PIE_CHART_COLORS.length];
}
