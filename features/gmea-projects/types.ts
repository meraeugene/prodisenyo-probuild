export type VatMode = "off" | "inclusive" | "exclusive";

export interface WorkbookSource {
  workbook: string;
  sheet: string;
  cells: string;
  sha256: string;
  imported_at: string;
}

export interface WorkbookExpenseBalance {
  amount: number;
  source_total: number;
  itemized_total: number;
  source: WorkbookSource;
  original_amount?: number;
  settlements?: { amount: number; expense_ids: string[]; source: WorkbookSource }[];
}

export interface ExpenseWorkbookItem {
  description: string;
  date: string;
  amount: number;
  invoice_number: string;
  supplier: string;
  source_cells: string;
}

export interface ImportedContractReceipt {
  id: string;
  amount: number;
  received_date: string | null;
  source: WorkbookSource;
}

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
  notes: string;
  is_new?: boolean;
  workbook_balance?: WorkbookExpenseBalance;
  workbook_source?: WorkbookSource;
  workbook_items?: ExpenseWorkbookItem[];
  source_previous_values?: { amount: number; invoice_number: string };
  workbook_import_delta?: number;
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
  imported_receipts?: ImportedContractReceipt[];
  /** Workbook label may differ from the fixed peso amount. */
  display_percentage?: number | null;
  summary_source?: WorkbookSource;
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
  title: string;
  name: string;
  color: string;
  client: string;
  location: string;
  contract_amount: number;
  tax_rate: number;
  status: "active" | "completed";
  completed_at: string | null;
  completed_by: string | null;
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
  | "title"
  | "name"
  | "color"
  | "client"
  | "location"
  | "duration"
>;

export interface ContractTermsInput {
  contract_amount: number;
  tax_rate: number;
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
  | { kind: "project_status"; value: { status: "active" | "completed" } }
  | { kind: "delete_project" }
  | { kind: "delete"; entity: "expense"; id: string };
