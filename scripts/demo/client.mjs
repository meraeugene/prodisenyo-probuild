import { createClient } from "@supabase/supabase-js";

export async function createDemoClient() {
  for (const file of [".env.local", ".env"]) {
    try {
      const values = process.loadEnvFile;
      // Preserve shell and .env.local values over .env defaults.
      if (values) process.loadEnvFile(file);
      else throw new Error("Demo scripts require Node.js 20.12 or later.");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function listAuthUsers(client) {
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 200) return users;
  }
}

export function checked(result, operation) {
  if (result.error) throw new Error(`${operation}: ${result.error.message}`);
  return result.data;
}

export async function preflightTables(client, tables, order) {
  const failures = [];
  for (const table of order) {
    const columns = [...new Set(tables[table].flatMap(Object.keys))].join(",");
    const { error } = await client.from(table).select(columns).limit(0);
    if (error) failures.push(`${table}: ${error.message}`);
  }
  if (failures.length) throw new Error(`Database schema is not ready:\n${failures.join("\n")}\n\nFor missing payroll review tables, overtime_multiplier, project progress, or GMEA status:\n1. Run npm run seed:prepare\n2. Run supabase/demo-seed-schema-repair.sql in your Supabase SQL Editor\n3. Rerun npm run seed:data\nOther missing modules require their corresponding repository migrations.`);
}
