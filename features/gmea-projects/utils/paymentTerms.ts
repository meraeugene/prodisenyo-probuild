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
