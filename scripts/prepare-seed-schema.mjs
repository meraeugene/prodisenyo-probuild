import fs from "node:fs/promises";
import path from "node:path";
import { buildDemoSchemaRepair } from "./demo/schemaRepair.mjs";

try {
  const destination = path.join(process.cwd(), "supabase", "demo-seed-schema-repair.sql");
  await fs.writeFile(destination, buildDemoSchemaRepair(), "utf8");
  console.log(`Prepared ${destination}`);
  console.log("Run the entire file in your Supabase SQL Editor, then rerun npm run seed:data.");
  console.log("This command only prepares SQL locally; it does not change your database.");
} catch (error) {
  console.error(`Schema preparation failed: ${error.message}`);
  process.exitCode = 1;
}
