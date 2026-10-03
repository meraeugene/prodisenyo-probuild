const test = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/loadGmeaModule.cjs");
const { selectPortfolioProjects } = load("features/projects/utils/projectPortfolioSelectors.ts");
const projects = [
  { id: "active", name: "Villa", location: "Manila", engineer: "Ana", status: "active", budget: 100, progress: 70, startDate: "2026-01-01", endDate: "2026-12-01" },
  { id: "estimate", name: "Office", location: "Cebu", engineer: "Ben", status: "planning", budget: 200, progress: 0, startDate: "2026-03-01", endDate: "2026-10-01" },
];

test("portfolio filters intersect search, status, and location without changing the source", () => {
  assert.deepEqual(selectPortfolioProjects(projects, { status: "active", search: " ANA ", location: "Manila", searchEngineer: true, sort: "name" }).map(p => p.id), ["active"]);
  assert.deepEqual(selectPortfolioProjects(projects, { status: "active", search: "Ana", location: "Cebu", searchEngineer: true, sort: "name" }), []);
  assert.deepEqual(selectPortfolioProjects(projects, { status: "all", search: "Ana", sort: "name" }), []);
  assert.deepEqual(projects.map(p => p.id), ["active", "estimate"]);
});

test("CEO start-date and engineer target-date sorting retain their distinct meanings", () => {
  assert.deepEqual(selectPortfolioProjects(projects, { status: "all", search: "", sort: "latest" }).map(p => p.id), ["estimate", "active"]);
  assert.deepEqual(selectPortfolioProjects(projects, { status: "all", search: "", sort: "updated" }).map(p => p.id), ["active", "estimate"]);
  assert.deepEqual(projects.map(p => p.id), ["active", "estimate"]);
});
