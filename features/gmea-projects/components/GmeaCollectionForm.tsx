"use client";

import { useState } from "react";
import type { ContractPaymentTermInput, GmeaProject } from "../types";
import { postedReceiptTotal } from "../utils/gmeaCalculations";
import {
  paymentTermInput,
  recalculatePercentageTerms,
} from "../utils/paymentTerms";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaDialog from "./GmeaDialog";
import { MoneyField } from "./GmeaFields";
import GmeaPaymentTermsEditor from "./GmeaPaymentTermsEditor";

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
                  payment_terms: rows,
                },
              })
      }
      wide
    >
      <fieldset disabled={readOnly} className="space-y-5">
        <MoneyField
          label="Contract amount (PHP) *"
          required
          value={contractAmount}
          onValueChange={(value) => {
            setContractAmount(value);
            setRows((current) => recalculatePercentageTerms(current, value));
          }}
        />
        <GmeaPaymentTermsEditor
          contractAmount={contractAmount}
          terms={rows}
          protectedAmounts={protectedAmounts}
          protectedTermIds={protectedTermIds}
          onChange={setRows}
        />
      </fieldset>
    </GmeaDialog>
  );
}
