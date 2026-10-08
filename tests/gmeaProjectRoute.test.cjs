const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");
const route = "app/(dashboard)/gmea-projects/[projectId]/page.tsx";
const projectId = "67f48a1a-cff4-46e4-aa79-93218bd8f987";

function loadRoute(role, project) {
  const calls = [];
  const Workspace = () => null;
  const page = load(route, {
    "next/navigation": { notFound() { throw new Error("NOT_FOUND"); } },
    "@/features/gmea-projects/components/GmeaProjectWorkspace": { default: Workspace },
    "@/features/gmea-projects/server/gmeaQueries": {
      requireGmeaAccess: async () => { calls.push("auth"); return { profile: { role } }; },
      getGmeaProjects: async id => { calls.push(id); return project ? [project] : []; },
      getGmeaExpenseOptions: async () => { calls.push("options"); return { suppliers: ["Vendor"], methods: [], invoiceNames: [] }; },
    },
  }).default;
  return { page, calls, Workspace };
}

test("project detail route renders the requested ongoing or completed record", async () => {
  for (const status of ["active", "completed"]) {
    const project = { id: projectId, status };
    const { page, calls, Workspace } = loadRoute("gmea", project);
    const result = await page({ params: Promise.resolve({ projectId }) });
    assert.equal(result.type, Workspace);
    assert.equal(result.props.project, project);
    assert.equal(result.props.canEdit, true);
    assert.deepEqual(calls, ["auth", projectId, "options"]);
  }
});

test("CEO project details stay read only", async () => {
  const { page, calls } = loadRoute("ceo", { id: projectId });
  const result = await page({ params: Promise.resolve({ projectId }) });
  assert.equal(result.props.canEdit, false);
  assert.deepEqual(calls, ["auth", projectId]);
});

test("invalid and missing project IDs render not found", async () => {
  const { page, calls } = loadRoute("gmea", null);
  await assert.rejects(page({ params: Promise.resolve({ projectId: "invalid" }) }), /NOT_FOUND/);
  assert.deepEqual(calls, ["auth"]);
  await assert.rejects(page({ params: Promise.resolve({ projectId }) }), /NOT_FOUND/);
});
