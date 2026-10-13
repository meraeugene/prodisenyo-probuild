import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import type { OperationExpense } from "../types";

type OperationDatabase = { public: {
  Tables: { gmea_operation_expenses: { Row: OperationExpense; Insert: Partial<OperationExpense>; Update: Partial<OperationExpense>; Relationships: [] } };
  Views: Record<string, never>; Functions: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never>;
} };
export async function operationExpensesReader() {
  return await createSupabaseServerClient() as unknown as SupabaseClient<OperationDatabase>;
}
export function operationExpensesWriter() {
  return createSupabaseAdminClient() as unknown as SupabaseClient<OperationDatabase>;
}
