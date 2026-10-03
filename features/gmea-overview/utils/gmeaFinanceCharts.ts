export const FINANCE_CHART_COLORS = {
  revenue: "#076d69",
  expenses: "#b8ded6",
  profit: "#076d69",
  loss: "#e11d48",
};

export function formatCompactOverviewMoney(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
