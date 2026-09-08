import type {
  ContractPaymentTerm,
  GmeaProject,
  VatMode,
} from "../types";

export function money(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) > 1e12)
    throw new Error("Enter a valid amount.");
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
  )
    throw new Error("Enter a valid amount and VAT rate.");

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

export function allocatePercentages(total: number, percentages: number[]) {
  let allocated = 0;
  let cumulative = 0;
  return percentages.map((percentage, index) => {
    cumulative = sumMoney([cumulative, percentage]);
    const target =
      index === percentages.length - 1
        ? total
        : money((total * cumulative) / 100);
    const amount = money(target - allocated);
    allocated = target;
    return amount;
  });
}

export function postedReceiptTotal(term: ContractPaymentTerm) {
  return sumMoney(
    term.receipts
      .filter((receipt) => receipt.status === "posted")
      .map((receipt) => receipt.amount),
  );
}

export function paymentTermSummary(term: ContractPaymentTerm) {
  const received = postedReceiptTotal(term);
  const balance = Math.max(0, money(term.amount - received));
  return {
    received,
    balance,
    status: received <= 0 ? "unpaid" : balance > 0 ? "partial" : "paid",
  } as const;
}

export function contractCollectionSummary(project: GmeaProject) {
  const scheduled = sumMoney(project.payment_terms.map((term) => term.amount));
  const received = sumMoney(
    project.payment_terms.map((term) => postedReceiptTotal(term)),
  );
  return {
    scheduled,
    received,
    outstanding: Math.max(0, money(project.contract_amount - received)),
  };
}

export function projectSummary(project: GmeaProject) {
  const contract = money(project.contract_amount);
  const expenses = sumMoney(
    project.expenses.map(
      (expense) =>
        vatBreakdown(expense.amount, expense.vat_mode, expense.vat_rate).gross,
    ),
  );
  const profit = money(contract - expenses);
  const distributable = Math.max(0, profit);
  const shares = allocatePercentages(
    distributable,
    project.partners.map((partner) => partner.percentage),
  );
  return {
    contract,
    expenses,
    profit,
    distributable,
    partners: project.partners.map((partner, index) => ({
      ...partner,
      amount: shares[index],
    })),
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
