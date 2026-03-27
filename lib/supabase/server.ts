import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseBrowserEnv, getSupabaseServerEnv } from "@/lib/env";

type CookieMutation = {
  name: string;
  value: string;
  options?: Parameters<(typeof cookies extends (...args: never[]) => Promise<infer T> ? T : never)["set"]>[2];
};

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseBrowserEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieMutation[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseServerEnv();

  return createServerClient<Database>(url, serviceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll(_cookiesToSet: CookieMutation[]) {
        return;
      },
    },
  });
}
