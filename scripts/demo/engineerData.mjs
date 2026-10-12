import { createDemoContext, demoId } from "./context.mjs";
import { buildProjectData } from "./projectData.mjs";
import { DEMO_FILES } from "./storage.mjs";

export function buildEngineerDemoData(username, users, now = new Date()) {
  const account = username.trim().toLowerCase();
  if (!/^[a-z0-9_]+$/.test(account)) throw new Error("Use an engineer username containing letters, numbers or underscores.");
  const context = createDemoContext(users, now);
  context.id = key => demoId(`engineer-account:${account}:${key}`);
  const tables = buildProjectData(context);
  const files = DEMO_FILES.map(file => ({ ...file, path: file.path.replace("/", `/engineer-account/${account}/`) }));
  const filePaths = new Map(DEMO_FILES.map((file, index) => [file.path, files[index].path]));
  for (const row of [...tables.project_documents, ...tables.workflow_evidence]) row.storage_path = filePaths.get(row.storage_path);
  const names = new Map(tables.projects.map(project => [project.name, project.name.replace("Demo ", `Demo ${account} `)]));
  for (const rows of Object.values(tables)) {
    for (const row of rows) {
      for (const [key, value] of Object.entries(row)) {
        if (names.has(value)) row[key] = names.get(value);
      }
    }
  }
  for (const item of tables.cost_catalog_items) item.name = item.name.replace("Demo ", `Demo ${account} `);
  // Only the requested engineer receives sample notifications.
  tables.workflow_notifications = tables.workflow_notifications.filter(row => row.recipient_id === users.engineer);
  return { context, tables, files };
}
