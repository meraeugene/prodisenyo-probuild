import type {
  ContractPaymentTerm,
  ContractPaymentTermInput,
} from "../types";
import { PAYMENT_TERM_TEMPLATES } from "./gmeaConstants";
import {
  allocatePercentages,
  money,
  sumMoney,
} from "./gmeaCalculations";

export function paymentTermInput(
  term: ContractPaymentTerm,
): ContractPaymentTermInput {
  const { receipts: _receipts, ...input } = term;
  return input;
}

export function buildPaymentTerms(
  templateId: string,
  contractAmount: number,
): ContractPaymentTermInput[] {
  if (templateId === "custom") return [];
  const template = PAYMENT_TERM_TEMPLATES.find((item) => item.id === templateId);
  if (!template) return [];
  const amounts = allocatePercentages(
    money(contractAmount),
    template.terms.map(([, percentage]) => percentage),
  );
  return template.terms.map(([description, percentage], index) => ({
    id: crypto.randomUUID(),
    description,
    value_mode: "percentage",
    percentage,
    amount: amounts[index],
    notes: "",
  }));
}

export function recalculatePercentageTerms(
  terms: ContractPaymentTermInput[],
  contractAmount: number,
) {
  const recalculated = terms.map((term) =>
    term.value_mode === "percentage"
      ? {
          ...term,
          amount: money(contractAmount * ((term.percentage ?? 0) / 100)),
        }
      : term,
  );
  const difference = money(
    contractAmount - sumMoney(recalculated.map((term) => term.amount)),
  );
  if (Math.abs(difference) <= 0.01) {
    const lastPercentageIndex = recalculated.findLastIndex(
      (term) => term.value_mode === "percentage",
    );
    if (lastPercentageIndex >= 0)
      recalculated[lastPercentageIndex] = {
        ...recalculated[lastPercentageIndex],
        amount: money(recalculated[lastPercentageIndex].amount + difference),
      };
  }
  return recalculated;
}

export function removePaymentTerm(
  terms: ContractPaymentTerm[],
  termId: string,
  contractAmount: number,
): ContractPaymentTermInput[] {
  if (terms.length <= 1) throw new Error("A payment schedule needs at least one term.");
  const removed = terms.find((term) => term.id === termId);
  if (!removed) throw new Error("Payment term not found.");
  if (removed.receipts.length) throw new Error("Terms with receipt history cannot be deleted.");

  const remaining = terms.filter((term) => term.id !== termId).map(paymentTermInput);
  const balanceIndex = remaining.length - 1;
  const scheduledWithoutRemoved = sumMoney(remaining.map((term) => term.amount));
  remaining[balanceIndex] = {
    ...remaining[balanceIndex],
    value_mode: "fixed",
    percentage: null,
    amount: money(remaining[balanceIndex].amount + contractAmount - scheduledWithoutRemoved),
  };
  return remaining;
}

export function updatePaymentTerm(
  terms: ContractPaymentTerm[],
  updated: ContractPaymentTermInput,
  contractAmount: number,
): ContractPaymentTermInput[] {
  const next = terms.map(paymentTermInput);
  const updatedIndex = next.findIndex((term) => term.id === updated.id);
  if (updatedIndex < 0) throw new Error("Payment term not found.");

  const normalized = updated.value_mode === "percentage"
    ? { ...updated, amount: money(contractAmount * ((updated.percentage ?? 0) / 100)) }
    : { ...updated, percentage: null };
  next[updatedIndex] = normalized;

  if (next.length === 1) {
    next[0] = { ...next[0], value_mode: "fixed", percentage: null, amount: money(contractAmount) };
    return next;
  }

  const balancingIndex = next.findLastIndex((term, index) => index !== updatedIndex && !terms[index].receipts.length);
  if (balancingIndex < 0) throw new Error("Another term without receipt history is needed to balance the schedule.");
  const difference = money(contractAmount - sumMoney(next.map((term) => term.amount)));
  const balancedAmount = money(next[balancingIndex].amount + difference);
  if (balancedAmount <= 0) throw new Error("This amount leaves no balance for the other payment terms.");
  next[balancingIndex] = { ...next[balancingIndex], value_mode: "fixed", percentage: null, amount: balancedAmount };
  return next;
}
