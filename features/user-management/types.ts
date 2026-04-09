import type { Database } from "@/types/database";

export type ManagedUserRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "username" | "email" | "role" | "is_active" | "created_at"
>;
