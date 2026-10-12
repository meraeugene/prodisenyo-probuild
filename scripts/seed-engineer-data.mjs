import process from "node:process";
import { createDemoClient, checked, preflightTables } from "./demo/client.mjs";
import { TABLE_ORDER } from "./demo/data.mjs";
import { buildEngineerDemoData } from "./demo/engineerData.mjs";
import { preflightStorage, seedDemoFiles } from "./demo/storage.mjs";

async function main() {
  const args = process.argv.slice(2);
  const username = args.find(arg => !arg.startsWith("--")) ?? "engineer";
  if (args.some(arg => arg.startsWith("--") && arg !== "--dry-run") || args.filter(arg => !arg.startsWith("--")).length > 1) {
    throw new Error("Usage: npm run seed:engineer -- [username] [--dry-run]");
  }
  const client = await createDemoClient();
  const profiles = checked(await client.from("profiles").select("id,username,role,is_active").in("role", ["engineer", "ceo", "purchaser"]), "Read seed accounts");
  const engineer = profiles.find(profile => profile.username === username && profile.role === "engineer" && profile.is_active);
  if (!engineer) throw new Error(`No active engineer account named ${username}.`);
  const users = { engineer: engineer.id };
  for (const role of ["ceo", "purchaser"]) {
    const profile = profiles.find(profile => profile.username === role && profile.role === role && profile.is_active)
      ?? profiles.find(profile => profile.role === role && profile.is_active);
    if (!profile) throw new Error(`An active ${role} account is required for project workflows.`);
    users[role] = profile.id;
  }
  const { context, tables, files } = buildEngineerDemoData(engineer.username, users);
  const order = TABLE_ORDER.filter(table => table in tables);
  await preflightTables(client, tables, order);
  await preflightStorage(client);
  console.log(`Engineer: ${engineer.username}`);
  for (const table of order) console.log(`${table}: ${tables[table].length} demo records`);
  if (args.includes("--dry-run")) {
    console.log("Preview complete. No account, database or file changes.");
    return;
  }
  await seedDemoFiles(client, tables, files);
  for (const table of order) {
    checked(await client.from(table).upsert(tables[table], { onConflict: "id", ignoreDuplicates: true }), `Seed engineer ${table}`);
  }
  checked(await client.from("projects").update({ active_approved_estimate_id: context.id("estimate:0") })
    .eq("id", context.id("project:0")).is("active_approved_estimate_id", null), "Link engineer approved estimate");
  const projects = checked(await client.from("projects").select("id,name,status,assigned_engineer_id,assigned_estimate_engineer_id")
    .in("id", tables.projects.map(project => project.id)), "Verify engineer project assignments");
  if (projects.length !== 4 || projects.some(project => project.assigned_engineer_id !== engineer.id || project.assigned_estimate_engineer_id !== engineer.id)) {
    throw new Error("Engineer project assignment verification failed.");
  }
  for (const project of projects) console.log(`Assigned: ${project.name} (${project.status})`);
  console.log(`Demo ready for ${engineer.username}. Existing credentials and records were retained.`);
}

main().catch(error => {
  console.error(`Engineer seed failed: ${error.message}`);
  process.exitCode = 1;
});
