const assert = require("node:assert/strict");
const test = require("node:test");
const React = require("react");
const load = require("./helpers/loadGmeaModule.cjs");

function hookHarness(file, name) {
  const states = [];
  let cursor = 0;
  const hook = load(file, { react: { ...React,
    useMemo: callback => callback(), useEffect: () => {},
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], value => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
    },
  } })[name];
  return (...args) => { cursor = 0; return hook(...args); };
}

test("shared pagination visits every record in five-row pages and clamps refreshed results", () => {
  const render = hookHarness("features/shared/hooks/useTablePagination.ts", "useTablePagination");
  const rows = Array.from({ length: 28 }, (_, id) => ({ id }));
  const visited = [];
  for (let page = 1; page <= 6; page++) {
    render(rows, "all").onPageChange(page);
    const view = render(rows, "all");
    assert.equal(view.pageSize, 5);
    assert.equal(view.totalPages, 6);
    assert.equal(view.pageRows.length, page === 6 ? 3 : 5);
    visited.push(...view.pageRows.map(row => row.id));
  }
  assert.deepEqual(visited, rows.map(row => row.id));
  const refreshed = render(rows.slice(0, 7), "all");
  assert.equal(refreshed.page, 2);
  assert.equal(refreshed.pageRows.length, 2);
  assert.equal(render(rows, "filtered").page, 1);
  assert.equal(render([], "empty").totalPages, 1);
  assert.deepEqual(render([], "empty").pageRows, []);
});

test("attendance daily summaries and detailed punches both use five-row pages", () => {
  const render = hookHarness("features/attendance/hooks/useAttendanceReview.ts", "useAttendanceReview");
  const records = Array.from({ length: 12 }, (_, index) => ({
    date: `2026-10-${String(index + 1).padStart(2, "0")}`, employee: "Ana Cruz",
    employeeId: "ana", logTime: "08:00", type: "IN", source: "Time1", site: "Manila",
  }));
  let view = render(records);
  assert.equal(view.totalRecordPages, 3);
  assert.equal(view.previewDailyRows.length, 5);
  view.setRecordsPage(3);
  view = render(records);
  assert.equal(view.previewDailyRows.length, 2);
  view.setStep2View("detailed");
  view.setRecordsPage(1);
  view = render(records);
  assert.equal(view.previewRecords.length, 5);
  view.setRecordsPage(3);
  assert.equal(render(records).previewRecords.length, 2);
});
