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
  description: string;
  start_date: string | null;
  end_date: string | null;
  duration: string;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
};
type GmeaDatabase = {
  public: {
    Tables: {
      gmea_projects: Table<ProjectRow>;
      gmea_quotations: Table<DataRow & { status: string; total: number }>;
      gmea_quotation_items: Table<{
        id: string;
        quotation_id: string;
        sort_order: number;
        description: string;
        unit: string;
        quantity: number;
        unit_price: number;
      }>;
      gmea_milestones: Table<DataRow>;
      gmea_receipts: Table<DataRow>;
      gmea_expenses: Table<DataRow>;
      gmea_partners: Table<DataRow>;
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
