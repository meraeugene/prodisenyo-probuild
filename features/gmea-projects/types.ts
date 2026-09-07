export type GmeaStatus =
  | "planning"
  | "active"
  | "on_hold"
  | "completed"
  | "archived";

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
  vat_mode: VatMode;
  vat_rate: number;
  method: string;
  notes: string;
}

export interface Partner {
  id: string;
  name: string;
  percentage: number;
}

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
  withholding_tax_rate: number;
  duration: string;
  status: GmeaStatus;
  version: number;
  created_at: string;
  updated_at: string;
  expenses: Expense[];
  partners: Partner[];
}

export type ProjectInput = Pick<
  GmeaProject,
  | "name"
  | "client"
  | "location"
  | "contract_amount"
  | "withholding_tax_rate"
  | "duration"
  | "status"
>;

export type GmeaMutation =
  | { kind: "project"; value: ProjectInput }
  | { kind: "expense"; value: Expense }
  | { kind: "partners"; value: Partner[] }
  | { kind: "delete"; entity: "expense"; id: string };
