import process from "node:process";
import { createDemoContext, DEMO_PASSWORD, DEMO_ROLES, demoAccount } from "./demo/context.mjs";
import { buildDemoData, TABLE_ORDER } from "./demo/data.mjs";
import { createDemoClient, checked, preflightTables } from "./demo/client.mjs";
import { seedDemoAccounts } from "./demo/accounts.mjs";
import { preflightStorage, seedDemoFiles } from "./demo/storage.mjs";

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--dry-run")) throw new Error("Usage: npm run seed:data [-- --dry-run]");
  const preview = buildDemoData(createDemoContext());
  if (args.includes("--dry-run")) {
    console.log("Demo preview only; no database connection or changes.");
    for (const table of TABLE_ORDER) console.log(`${table}: ${preview[table].length} records`);
    console.log(`Accounts: ${DEMO_ROLES.map((role) => demoAccount(role).username).join(", ")}`);
    return;
  }
  const client = await createDemoClient();
  const password = process.env.DEMO_SEED_PASSWORD || DEMO_PASSWORD;
  if (password.length < 8) throw new Error("DEMO_SEED_PASSWORD must contain at least 8 characters.");
  await preflightTables(client, preview, TABLE_ORDER);
  await preflightStorage(client);
  const users = await seedDemoAccounts(client, password);
  const context = createDemoContext(users);
  const tables = buildDemoData(context);
  await seedDemoFiles(client, tables);
  for (const table of TABLE_ORDER) {
    const rows = tables[table];
    for (let start = 0; start < rows.length; start += 200) {
      const onConflict = table.endsWith("expense_notifications") ? "expense_id,recipient_id" : "id";
      checked(await client.from(table).upsert(rows.slice(start, start + 200), { onConflict, ignoreDuplicates: true }), `Seed ${table}`);
    }
    console.log(`${table}: ${rows.length} demo records ensured`);
  }
  // Resolve the project/estimate circular reference after both parents exist.
  checked(await client.from("projects").update({ active_approved_estimate_id: context.id("estimate:0") }).eq("id", context.id("project:0")).is("active_approved_estimate_id", null), "Link approved estimate");
  console.log("\nDemo ready. Sign in using a username:");
  for (const role of DEMO_ROLES) console.log(`  ${demoAccount(role).username} (${role})`);
  console.log(process.env.DEMO_SEED_PASSWORD ? "Password: your DEMO_SEED_PASSWORD" : `Password: ${DEMO_PASSWORD}`);
  console.log("Existing demo accounts keep their password and UI edits. To start fresh: npm run seed:delete, then npm run seed:data.");
}

main().catch((error) => {
  console.error(`Demo seed failed: ${error.message}\nIf partially seeded, rerun seed:data to resume or seed:delete to clean up.`);
  process.exitCode = 1;
});
