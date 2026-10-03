import process from "node:process";
import { createDemoClient, checked, listAuthUsers } from "./demo/client.mjs";
import { isDemoAccount } from "./demo/accounts.mjs";
import { createDemoContext } from "./demo/context.mjs";
import { buildDemoData, TABLE_ORDER } from "./demo/data.mjs";
import { deleteDemoFiles } from "./demo/storage.mjs";

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--dry-run")) throw new Error("Usage: npm run seed:delete [-- --dry-run]");
  if (args.includes("--dry-run")) {
    console.log("Cleanup preview only; no database connection or changes.");
    console.log(`Delete reserved demo IDs from: ${[...TABLE_ORDER].reverse().join(", ")}`);
    console.log("Delete only auth accounts marked prodisenyo-ui-demo-v1 with an expected demo email. Demo project children may cascade.");
    return;
  }
  const client = await createDemoClient();
  const tables = buildDemoData(createDemoContext());
  // Exact, stable IDs work across dates, machines, repeated runs and partial failures.
  for (const table of [...TABLE_ORDER].reverse()) {
    const ids = tables[table].map((row) => row.id);
    for (let start = 0; start < ids.length; start += 200) {
      const result = await client.from(table).delete().in("id", ids.slice(start, start + 200));
      // Permit cleanup when an optional module has not been installed yet.
      if (["PGRST205", "42P01"].includes(result.error?.code)) break;
      checked(result, `Delete demo ${table}`);
    }
    console.log(`Cleaned demo ${table}`);
  }
  await deleteDemoFiles(client);
  for (const user of await listAuthUsers(client)) {
    if (!isDemoAccount(user)) continue;
    checked(await client.auth.admin.deleteUser(user.id), `Delete ${user.email}`);
    console.log(`Deleted ${user.email}`);
  }
  console.log("Demo cleanup complete. Existing accounts and unrelated records were retained.");
}

main().catch((error) => {
  console.error(`Demo cleanup failed: ${error.message}\nCleanup is safe to rerun after resolving the error.`);
  process.exitCode = 1;
});
