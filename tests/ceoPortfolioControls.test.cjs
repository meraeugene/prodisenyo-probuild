const test = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/loadGmeaModule.cjs");
const { selectCeoProjectPortfolio } = load("features/projects/utils/ceoProjectPortfolio.ts");
const { sortCeoGmeaProjects } = load("features/gmea-projects/utils/ceoPortfolioSorting.ts");
const { selectCeoRentals, selectCeoEquipment, buildCeoRentalAmounts } = load("features/gmea-rentals/utils/ceoRentalSelectors.ts");

test("CEO project column sorting combines filters and leaves the original list intact", () => {
  const projects = [
    { id: "a", name: "Alpha", location: "Manila", engineer: "Ana", status: "active", budget: 100, spent: 50, progress: 30, startDate: "2026-09-01", endDate: "2026-12-01" },
    { id: "b", name: "Beta", location: "Manila", engineer: "Ana", status: "active", budget: 200, spent: 40, progress: 70, startDate: "2026-09-02", endDate: "2026-11-01" },
    { id: "c", name: "Charlie", location: "Cebu", engineer: "Ben", status: "planning", budget: 300, spent: 10, progress: 0, startDate: "2026-09-03", endDate: "2026-10-01" },
  ];
  const filters = { status: "active", search: " ana ", location: "Manila", sort: "budget", direction: "desc" };
  assert.deepEqual(selectCeoProjectPortfolio(projects, filters).map((row) => row.id), ["b", "a"]);
  assert.deepEqual(selectCeoProjectPortfolio(projects, { ...filters, direction: "asc" }).map((row) => row.id), ["a", "b"]);
  assert.deepEqual(selectCeoProjectPortfolio(projects, { ...filters, sort: "spent" }).map((row) => row.id), ["a", "b"]);
  assert.deepEqual(selectCeoProjectPortfolio(projects, { ...filters, sort: "endDate", direction: "asc" }).map((row) => row.id), ["b", "a"]);
  assert.deepEqual(projects.map((row) => row.id), ["a", "b", "c"]);
});

test("GMEA financial column sorting uses gross contract and posted collections", () => {
  const project = (id, contract, tax, received) => ({ id, name: id, created_at: "2026-09-01", contract_amount: contract, tax_rate: tax, expenses: [], partners: [], payment_terms: [{ amount: contract, value_mode: "fixed", receipts: [{ amount: received, status: "posted" }, { amount: 10000, status: "voided" }] }] });
  const projects = [project("a", 100, 12, 90), project("b", 110, 0, 50)];
  assert.deepEqual(sortCeoGmeaProjects(projects, "contract", "desc").map((row) => row.id), ["a", "b"]);
  assert.deepEqual(sortCeoGmeaProjects(projects, "outstanding", "desc").map((row) => row.id), ["b", "a"]);
  assert.deepEqual(sortCeoGmeaProjects(projects, "collected", "desc").map((row) => row.id), ["a", "b"]);
  assert.deepEqual(projects.map((row) => row.id), ["a", "b"]);
});

test("CEO rentals intersect status and search and never count voided payments", () => {
  const rental = { id: "a", rental_number: "R-1", client: "Harbor", location: "Manila", status: "active", start_date: "2026-09-01", items: [{ subtotal: 20000 }], payments: [{ status: "posted", amount: 5000 }, { status: "voided", amount: 10000 }] };
  assert.equal(selectCeoRentals([rental], " HARBOR ", "active").length, 1);
  assert.equal(selectCeoRentals([rental], "Harbor", "completed").length, 0);
  assert.deepEqual(buildCeoRentalAmounts(rental), { amount: 20000, collected: 5000, outstanding: 15000 });
  const equipment = { name: "Excavator", code: "EQ-1", equipment_type: "Heavy equipment", plate_number: "ABC 123", status: "available" };
  assert.equal(selectCeoEquipment([equipment], " abc ", "available").length, 1);
  assert.equal(selectCeoEquipment([equipment], "abc", "on_rental").length, 0);
});

test("CEO approvals search the displayed payroll site and intersect resolved statuses", () => {
  const { selectCeoApprovalRows } = load("features/payroll/utils/ceoApprovalFilters.ts");
  const rows = [
    { employee_name: "Juan", site_name: null, period_label: null, payroll_runs: [{ site_name: "Manila", period_label: "October 1–15" }], status: "pending" },
    { employee_name: "Ana", site_name: "Cebu", period_label: "October 1–15", reason: "Site turnover", status: "approved" },
  ];
  assert.deepEqual(selectCeoApprovalRows(rows, " MANILA ", "pending"), [rows[0]]);
  assert.deepEqual(selectCeoApprovalRows(rows, "turnover", "approved"), [rows[1]]);
  assert.deepEqual(selectCeoApprovalRows(rows, "Juan", "rejected"), []);
});
