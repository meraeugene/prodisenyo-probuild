"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseBrowserEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null =
  null;

export function createSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, anonKey } = getSupabaseBrowserEnv();
  browserClient = createBrowserClient<Database>(url, anonKey);
  return browserClient;
}
