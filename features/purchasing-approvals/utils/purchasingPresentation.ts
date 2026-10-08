export const formatPurchaseMoney = (value: number) => new Intl.NumberFormat("en-PH", {
  style: "currency", currency: "PHP", maximumFractionDigits: 2,
}).format(value);

export const purchaseStatusLabel = (value: string) => value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
