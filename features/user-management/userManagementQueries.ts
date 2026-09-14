import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { ManagedUserRow } from "./types";

const USER_BATCH_SIZE = 500;

export async function listManagedUsers() {
  const database = createSupabaseAdminClient();
  const users: ManagedUserRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await database
      .from("profiles")
      .select("id, full_name, username, email, role, is_active, created_at")
      .order("created_at", { ascending: false })
      .range(from, from + USER_BATCH_SIZE - 1);

    if (error) {
      throw new Error(`Failed to load user accounts. ${error.message}`);
    }

    const batch = (data ?? []) as ManagedUserRow[];
    users.push(...batch);

    if (batch.length < USER_BATCH_SIZE) break;
    from += USER_BATCH_SIZE;
  }

  return users;
}
