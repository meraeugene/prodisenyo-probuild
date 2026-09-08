export type VatMode = "off" | "inclusive" | "exclusive";

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  supplier: string;
  invoice_number: string;
  invoice_name: string;
  amount: number;
  refunded_amount: number;
  vat_mode: VatMode;
  vat_rate: number;
  method: string;
  is_new?: boolean;
}

export interface Partner {
  id: string;
  name: string;
  percentage: number;
}

export type PaymentTermValueMode = "percentage" | "fixed";

export interface ContractReceipt {
  id: string;
  term_id: string;
  amount: number;
  received_date: string;
  method: string;
  reference_number: string;
  notes: string;
  status: "posted" | "voided";
  recorded_by: string;
  recorded_at: string;
  voided_by: string | null;
  voided_at: string | null;
  void_reason: string;
}

export interface ContractPaymentTerm {
  id: string;
  description: string;
  value_mode: PaymentTermValueMode;
  percentage: number | null;
  amount: number;
  notes: string;
  receipts: ContractReceipt[];
}

export type ContractPaymentTermInput = Omit<
  ContractPaymentTerm,
  "receipts"
>;

export interface GmeaExpenseOptions {
  suppliers: string[];
  methods: string[];
  invoiceNames: string[];
}

export interface GmeaProject {
  id: string;
  name: string;
  client: string;
  location: string;
  contract_amount: number;
  duration: string;
  version: number;
  created_at: string;
  updated_at: string;
  expenses: Expense[];
  payment_terms: ContractPaymentTerm[];
  partners: Partner[];
}

export type ProjectDetailsInput = Pick<
  GmeaProject,
  | "name"
  | "client"
  | "location"
  | "duration"
>;

export interface ContractTermsInput {
  contract_amount: number;
  payment_terms: ContractPaymentTermInput[];
}

export interface CreateProjectInput {
  details: ProjectDetailsInput;
  contract: ContractTermsInput;
}

export type GmeaMutation =
  | { kind: "create_project"; value: CreateProjectInput }
  | { kind: "project_details"; value: ProjectDetailsInput }
  | { kind: "contract_terms"; value: ContractTermsInput }
  | {
      kind: "record_receipt";
      value: Pick<
        ContractReceipt,
        | "id"
        | "term_id"
        | "amount"
        | "received_date"
        | "method"
        | "reference_number"
        | "notes"
      >;
    }
  | { kind: "void_receipt"; receipt_id: string; reason: string }
  | { kind: "expense"; value: Expense }
  | { kind: "partners"; value: Partner[] }
  | { kind: "delete_project" }
  | { kind: "delete"; entity: "expense"; id: string };
