export type GmeaStatus =
  "planning" | "active" | "on_hold" | "completed" | "archived";
export type VatMode = "off" | "inclusive" | "exclusive";
export interface QuotationItem {
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
}
export interface Quotation {
  id: string;
  project_id: string;
  reference: string;
  date: string;
  notes: string;
  status: "draft" | "accepted" | "superseded";
  discount: number;
  vat_mode: VatMode;
  vat_rate: number;
  total: number;
  items: QuotationItem[];
}
export interface Milestone {
  id: string;
  label: string;
  percentage: number;
}
export interface Receipt {
  id: string;
  milestone_id: string | null;
  date: string;
  cash: number;
  withholding: number;
  method: string;
  reference: string;
  notes: string;
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
export interface GmeaProject {
  id: string;
  name: string;
  client: string;
  location: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  duration: string;
  status: GmeaStatus;
  version: number;
  created_at: string;
  updated_at: string;
  quotations: Quotation[];
  milestones: Milestone[];
  receipts: Receipt[];
  expenses: Expense[];
  partners: Partner[];
}
export type ProjectInput = Pick<
  GmeaProject,
  | "name"
  | "client"
  | "location"
  | "description"
  | "start_date"
  | "end_date"
  | "duration"
  | "status"
>;
export type GmeaMutation =
  | { kind: "project"; value: ProjectInput }
  | { kind: "quotation"; value: Quotation }
  | { kind: "accept"; id: string }
  | { kind: "milestones"; value: Milestone[] }
  | { kind: "receipt"; value: Receipt }
  | { kind: "expense"; value: Expense }
  | { kind: "partners"; value: Partner[] }
  | { kind: "delete"; entity: "quotation" | "receipt" | "expense"; id: string };
