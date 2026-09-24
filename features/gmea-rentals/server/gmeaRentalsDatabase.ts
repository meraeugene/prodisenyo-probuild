import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

type EquipmentRow = {
  id: string;
  code: string;
  name: string;
  equipment_type: string;
  plate_number: string;
  default_rate: number | null;
  rate_unit: string | null;
  notes: string;
  status: string;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
};
type RentalRow = {
  id: string;
  rental_number: string;
  customer_name: string;
  site_location: string;
  start_date: string;
  expected_return_date: string | null;
  notes: string;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
};
type RentalItemRow = {
  id: string;
  rental_id: string;
  equipment_id: string;
  equipment_name: string;
  quantity: number;
  rate: number;
  rate_unit: string;
  notes: string;
  created_at: string;
  updated_at: string;
};
type RentalPaymentRow = {
  id: string;
  rental_id: string;
  amount: number;
  payment_date: string;
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
type RentalWorkerRow = {
  id: string;
  full_name: string;
  role_name: string;
  contact_number: string;
  status: "active" | "inactive";
  version: number;
  created_at: string;
  updated_at: string;
};
type RentalAssignmentRow = {
  id: string;
  rental_id: string;
  worker_id: string;
  equipment_id: string | null;
  assigned_from: string;
  assigned_until: string | null;
  status: "assigned" | "completed" | "cancelled";
};
type RentalExpenseCategoryRow = {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
};
type RentalExpenseRow = {
  id: string;
  rental_id: string | null;
  equipment_id: string | null;
  category_id: string;
  expense_date: string;
  description: string;
  supplier: string;
  method: string;
  invoice_number: string;
  amount: number;
  refunded_amount: number;
  vat_mode: "off" | "inclusive" | "exclusive";
  vat_rate: number;
  notes: string;
  version: number;
  created_at: string;
  updated_at: string;
};
type Table<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};
type RentalsDatabase = {
  public: {
    Tables: {
      gmea_rental_equipment: Table<EquipmentRow>;
      gmea_rentals: Table<RentalRow>;
      gmea_rental_items: Table<RentalItemRow>;
      gmea_rental_payments: Table<RentalPaymentRow>;
      gmea_rental_workers: Table<RentalWorkerRow>;
      gmea_rental_worker_assignments: Table<RentalAssignmentRow>;
      gmea_rental_expense_categories: Table<RentalExpenseCategoryRow>;
      gmea_rental_expenses: Table<RentalExpenseRow>;
    };
    Views: Record<string, never>;
    Functions: {
      mutate_gmea_rental_equipment: {
        Args: {
          p_actor: string;
          p_equipment: string | null;
          p_version: number | null;
          p_command: unknown;
        };
        Returns: string;
      };
      mutate_gmea_rental: {
        Args: {
          p_actor: string;
          p_rental: string | null;
          p_version: number | null;
          p_command: unknown;
        };
        Returns: string;
      };
      mutate_gmea_rental_collection: {
        Args: {
          p_actor: string;
          p_rental: string;
          p_version: number;
          p_command: unknown;
        };
        Returns: string;
      };
      mutate_gmea_rental_worker: {
        Args: {
          p_actor: string;
          p_worker: string | null;
          p_version: number | null;
          p_command: unknown;
        };
        Returns: string;
      };
      mutate_gmea_rental_assignment: {
        Args: {
          p_actor: string;
          p_rental: string;
          p_version: number;
          p_command: unknown;
        };
        Returns: string;
      };
      mutate_gmea_rental_expense: {
        Args: {
          p_actor: string;
          p_expense: string | null;
          p_version: number | null;
          p_command: unknown;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export async function gmeaRentalsReader() {
  return (await createSupabaseServerClient()) as unknown as SupabaseClient<RentalsDatabase>;
}
export function gmeaRentalsWriter() {
  return createSupabaseAdminClient() as unknown as SupabaseClient<RentalsDatabase>;
}
