const assert = require("node:assert/strict");
const test = require("node:test");

test("engineer demo assigns records to the selected account with stable isolated IDs", async () => {
  const { buildEngineerDemoData } = await import("../scripts/demo/engineerData.mjs");
  const { buildProjectData } = await import("../scripts/demo/projectData.mjs");
  const { createDemoContext } = await import("../scripts/demo/context.mjs");
  const users = { engineer: "engineer-account-id", ceo: "ceo-id", purchaser: "purchaser-id" };
  const { tables } = buildEngineerDemoData("engineer", users, new Date("2026-10-12T00:00:00Z"));
  const standardIds = new Set(Object.values(buildProjectData(createDemoContext())).flat().map(row => row.id));
  assert.ok(Object.values(tables).flat().every(row => !standardIds.has(row.id)));
  assert.equal(tables.projects.length, 4);
  assert.deepEqual(tables.projects.map(row => row.status), ["active", "on_hold", "completed", "planning"]);
  assert.ok(tables.projects.every(row => row.assigned_engineer_id === users.engineer && row.assigned_estimate_engineer_id === users.engineer));
  assert.ok(tables.project_tasks.every(row => row.assigned_to === users.engineer));
  assert.ok(tables.project_estimates.every(row => row.requested_by === users.engineer));
  assert.ok(tables.material_requests.every(row => row.requested_by === users.engineer));
  assert.equal(tables.workflow_notifications.length, 1);
  const standardPaths = new Set(buildProjectData(createDemoContext()).project_documents.map(row => row.storage_path));
  assert.ok(tables.project_documents.every(row => !standardPaths.has(row.storage_path)));
  const rerun = buildEngineerDemoData("engineer", users, new Date("2026-10-15T00:00:00Z"));
  assert.deepEqual(rerun.tables.projects.map(row => row.id), tables.projects.map(row => row.id));
});
