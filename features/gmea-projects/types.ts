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

export interface ContractCollection {
  id: string;
  description: string;
  amount: number;
  notes: string;
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
  duration: string;
  version: number;
  created_at: string;
  updated_at: string;
  expenses: Expense[];
  collections: ContractCollection[];
  partners: Partner[];
}

export type ProjectInput = Pick<
  GmeaProject,
  | "name"
  | "client"
  | "location"
  | "contract_amount"
  | "duration"
>;

export type GmeaMutation =
  | { kind: "project"; value: ProjectInput }
  | { kind: "expense"; value: Expense }
  | { kind: "collections"; value: ContractCollection[] }
  | { kind: "partners"; value: Partner[] }
  | { kind: "delete_project" }
  | { kind: "delete"; entity: "expense"; id: string };
