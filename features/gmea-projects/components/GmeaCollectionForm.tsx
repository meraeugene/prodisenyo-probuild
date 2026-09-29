"use client";

import { useState } from "react";
import type { ContractPaymentTermInput, GmeaProject } from "../types";
import { postedReceiptTotal, projectContractBreakdown } from "../utils/gmeaCalculations";
import {
  paymentTermInput,
  recalculatePercentageTerms,
} from "../utils/paymentTerms";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaDialog from "./GmeaDialog";
import { MoneyField } from "./GmeaFields";
import GmeaPaymentTermsEditor from "./GmeaPaymentTermsEditor";
import GmeaContractTaxFields from "./GmeaContractTaxFields";

export default function GmeaCollectionForm({
  project,
  readOnly = false,
  onClose,
}: {
  project: GmeaProject;
  readOnly?: boolean;
  onClose: () => void;
}) {
  const [contractAmount, setContractAmount] = useState(project.contract_amount);
  const [taxEnabled, setTaxEnabled] = useState(project.tax_rate > 0);
  const [taxRate, setTaxRate] = useState(project.tax_rate);
  const [rows, setRows] = useState<ContractPaymentTermInput[]>(() =>
    project.payment_terms.map(paymentTermInput),
  );
  const save = useGmeaMutation(project);
  const protectedAmounts = Object.fromEntries(
    project.payment_terms.map((term) => [term.id, postedReceiptTotal(term)]),
  );
  const protectedTermIds = project.payment_terms
    .filter((term) => term.receipts.length > 0)
    .map((term) => term.id);
  const totalContract = projectContractBreakdown({
    contract_amount: contractAmount,
    tax_rate: taxEnabled ? taxRate : 0,
  }).totalContract;
  function updateTax(nextRate: number) {
    setTaxRate(nextRate);
    const nextTotal = projectContractBreakdown({
      contract_amount: contractAmount,
      tax_rate: nextRate,
    }).totalContract;
    setRows((current) => recalculatePercentageTerms(current, nextTotal));
  }

  return (
    <GmeaDialog
      title={readOnly ? "Payment schedule" : "Edit contract and payment schedule"}
      onClose={onClose}
      onSave={
        readOnly
          ? undefined
          : () =>
              save({
                kind: "contract_terms",
                value: {
                  contract_amount: contractAmount,
                  tax_rate: taxEnabled ? taxRate : 0,
                  payment_terms: rows,
                },
              })
      }
      wide
    >
      <fieldset disabled={readOnly} className="space-y-5">
        <MoneyField
          label="Pre-tax contract amount (PHP) *"
          required
          value={contractAmount}
          onValueChange={(value) => {
            setContractAmount(value);
            const nextTotal = projectContractBreakdown({
              contract_amount: value,
              tax_rate: taxEnabled ? taxRate : 0,
            }).totalContract;
            setRows((current) => recalculatePercentageTerms(current, nextTotal));
          }}
        />
        <GmeaContractTaxFields
          enabled={taxEnabled}
          baseAmount={contractAmount}
          taxRate={taxRate}
          onEnabledChange={(enabled) => {
            setTaxEnabled(enabled);
            updateTax(enabled ? (taxRate || 12) : 0);
          }}
          onTaxRateChange={updateTax}
        />
        <GmeaPaymentTermsEditor
          contractAmount={totalContract}
          terms={rows}
          protectedAmounts={protectedAmounts}
          protectedTermIds={protectedTermIds}
          onChange={setRows}
        />
      </fieldset>
    </GmeaDialog>
  );
}
