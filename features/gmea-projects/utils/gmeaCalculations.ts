import type { GmeaProject, Quotation, VatMode } from "../types";

export function money(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) > 1e12)
    throw new Error("Enter a valid amount.");
  // Round the decimal representation, including exponent notation, without binary half-cent drift.
  const [coefficient, exponent = "0"] = Math.abs(value).toString().split("e");
  const [whole, fraction = ""] = coefficient.split(".");
  const digits = BigInt(whole + fraction);
  const shift = 2 + Number(exponent) - fraction.length;
  const power = BigInt(10) ** BigInt(Math.abs(shift));
  const cents =
    shift >= 0 ? digits * power : (digits + power / BigInt(2)) / power;
  return (Math.sign(value) * Number(cents)) / 100;
}
export function sumMoney(values: number[]) {
  return (
    values.reduce((sum, value) => sum + Math.round(money(value) * 100), 0) / 100
  );
}
export function vatBreakdown(amount: number, mode: VatMode, rate: number) {
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
  amount = money(amount);
  const base = mode === "inclusive" ? money(amount / (1 + rate / 100)) : amount;
  const vat =
    mode === "off"
      ? 0
      : mode === "inclusive"
        ? money(amount - base)
        : money((base * rate) / 100);
  return { base, vat, gross: sumMoney([base, vat]) };
}
export function quotationTotals(
  quote: Pick<Quotation, "items" | "discount" | "vat_mode" | "vat_rate">,
) {
  const lines = quote.items.map((item) => {
    if (
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0 ||
      item.unit_price < 0
    )
      throw new Error(
        "Quantity must be positive and price cannot be negative.",
      );
    return money(item.quantity * item.unit_price);
  });
  const subtotal = sumMoney(lines);
  const discount = money(quote.discount);
  if (discount < 0 || discount > subtotal)
    throw new Error("Discount cannot exceed the subtotal.");
  return {
    lines,
    subtotal,
    discount,
    ...vatBreakdown(money(subtotal - discount), quote.vat_mode, quote.vat_rate),
  };
}
export function allocatePercentages(total: number | null, percentages: number[]) {
  let allocated = 0, cumulative = 0;
  return percentages.map((percentage, index) => {
    cumulative = sumMoney([cumulative, percentage]);
    if (total === null) return null;
    const target = index === percentages.length - 1 ? total : money(total * cumulative / 100);
    const amount = money(target - allocated);
    allocated = target;
    return amount;
  });
}
export function projectSummary(project: GmeaProject) {
  const accepted = project.quotations.find((q) => q.status === "accepted");
  const contract = accepted ? quotationTotals(accepted).gross : null;
  const expenses = sumMoney(
    project.expenses.map(
      (e) => vatBreakdown(e.amount, e.vat_mode, e.vat_rate).gross,
    ),
  );
  const cash = sumMoney(project.receipts.map((r) => r.cash));
  const withholding = sumMoney(project.receipts.map((r) => r.withholding));
  const balance =
    contract === null ? null : money(contract - cash - withholding);
  const profit = contract === null ? null : money(contract - expenses);
  const sharing = profit === null ? null : money(profit - withholding);
  const distributable = sharing === null ? null : Math.max(0, sharing);
  const amounts = allocatePercentages(distributable, project.partners.map(p => p.percentage));
  const partners = project.partners.map((p, i) => ({ ...p, amount: amounts[i] }));
  return {
    contract,
    expenses,
    cash,
    withholding,
    profit,
    sharing,
    distributable,
    partners,
    outstanding: balance === null ? null : Math.max(0, balance),
    overpayment: balance === null ? null : Math.max(0, -balance),
  };
}
export function milestoneSummary(project: GmeaProject, milestoneId: string) {
  const milestone = project.milestones.find((m) => m.id === milestoneId);
  const contract = projectSummary(project).contract;
  const amounts = allocatePercentages(contract, project.milestones.map(m => m.percentage));
  const due = milestone ? amounts[project.milestones.indexOf(milestone)] : null;
  const settled = sumMoney(
    project.receipts
      .filter((r) => r.milestone_id === milestoneId)
      .flatMap((r) => [r.cash, r.withholding]),
  );
  return {
    due,
    settled,
    status:
      due === null
        ? "No contract"
        : settled >= due
          ? "Paid"
          : settled > 0
            ? "Partial"
            : "Unpaid",
  };
}
export function formatMoney(value: number | null) {
  return value === null
    ? "Not set"
    : new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(value);
}
