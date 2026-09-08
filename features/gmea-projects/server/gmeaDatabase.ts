import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@/types/database";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};
export type DataRow = {
  id: string;
  project_id: string;
  data: Record<string, Json>;
  created_at: string;
  updated_at: string;
};
export type ProjectRow = {
  id: string;
  name: string;
  client: string;
  location: string;
  contract_amount: number;
  duration: string;
  version: number;
  created_at: string;
  updated_at: string;
};
type ExpenseNotificationRow = {
  id: string;
  expense_id: string;
  project_id: string;
  recipient_id: string;
  read_at: string | null;
  created_at: string;
};
export type ReceiptRow = {
  id: string;
  project_id: string;
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
};
type GmeaDatabase = {
  public: {
    Tables: {
      gmea_projects: Table<ProjectRow>;
      gmea_expenses: Table<DataRow>;
      gmea_collections: Table<DataRow>;
      gmea_collection_receipts: Table<ReceiptRow>;
      gmea_expense_notifications: Table<ExpenseNotificationRow>;
      gmea_partners: Table<DataRow>;
      gmea_expense_options: Table<{
        id: string;
        field: string;
        value: string;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      mutate_gmea_project: {
        Args: {
          p_actor: string;
          p_project: string | null;
          p_version: number | null;
          p_command: Json;
        };
        Returns: string;
      };
      mark_gmea_expense_viewed: {
        Args: {
          p_actor: string;
          p_project: string;
          p_expense: string;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
export async function gmeaReader() {
  return (await createSupabaseServerClient()) as unknown as SupabaseClient<GmeaDatabase>;
}
export function gmeaWriter() {
  return createSupabaseAdminClient() as unknown as SupabaseClient<GmeaDatabase>;
}
