import process from "node:process";
import { createDemoClient, checked, listAuthUsers } from "./demo/client.mjs";
import { isDemoAccount } from "./demo/accounts.mjs";
import { demoAccount } from "./demo/context.mjs";
import { buildDemoCleanupPlan } from "./demo/cleanup.mjs";
import { deleteDemoFiles } from "./demo/storage.mjs";

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => !["--dry-run", "--gmea"].includes(arg))) throw new Error("Usage: npm run seed:delete [-- --dry-run] [-- --gmea]");
  const gmeaOnly = args.includes("--gmea");
  const plan = buildDemoCleanupPlan(gmeaOnly);
  const emails = plan.roles.map((role) => demoAccount(role).email);
  if (args.includes("--dry-run")) {
    console.log("Cleanup preview only; no database connection or changes.");
    console.log(`Delete reserved demo IDs from: ${plan.order.join(", ")}`);
    console.log(`Delete only auth accounts marked prodisenyo-ui-demo-v1 with these emails: ${emails.join(", ")}. Demo project children may cascade.`);
    console.log(plan.deleteFiles ? "Delete the seed's sample PDF files." : "Keep other demo modules, accounts, and files.");
    return;
  }
  const client = await createDemoClient();
  // Exact, stable IDs work across dates, machines, repeated runs and partial failures.
  for (const table of plan.order) {
    const ids = plan.tables[table].map((row) => row.id);
    for (let start = 0; start < ids.length; start += 200) {
      const result = await client.from(table).delete().in("id", ids.slice(start, start + 200));
      // Permit cleanup when an optional module has not been installed yet.
      if (["PGRST205", "42P01"].includes(result.error?.code)) break;
      checked(result, `Delete demo ${table}`);
    }
    console.log(`Cleaned demo ${table}`);
  }
  if (plan.deleteFiles) await deleteDemoFiles(client);
  for (const user of await listAuthUsers(client)) {
    if (!isDemoAccount(user) || !emails.includes(user.email)) continue;
    checked(await client.auth.admin.deleteUser(user.id), `Delete ${user.email}`);
    console.log(`Deleted ${user.email}`);
  }
  console.log(`${gmeaOnly ? "GMEA demo" : "Demo"} cleanup complete. Existing accounts and unrelated records were retained.`);
}

main().catch((error) => {
  console.error(`Demo cleanup failed: ${error.message}\nCleanup is safe to rerun after resolving the error.`);
  process.exitCode = 1;
});
