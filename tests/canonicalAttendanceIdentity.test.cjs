const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");

const { formatBiometricDisplayName, mapCanonicalAttendanceRecords } = load(
  "features/attendance/utils/attendanceRecordMapper.ts",
);
const { buildDailyRows } = load(
  "features/attendance/utils/attendanceSelectors.ts",
);
const { coalescePayrollAttendanceInputs } = load(
  "features/payroll/utils/payrollSelectors.ts",
);
const { groupByEmployee } = load(
  "features/payroll/utils/payrollSectionHelpers.ts",
);

function storedPunch(overrides = {}) {
  return {
    id: "punch-1",
    import_id: "import-1",
    employee_id: "adam-id",
    employee_name: "s adam",
    raw_biometric_name: "s adam",
    normalized_biometric_name: "s adam",
    match_status: "MATCHED",
    match_source: "EXISTING_ALIAS",
    log_date: "2026-02-27",
    log_time: "08:00:00",
    log_type: "IN",
    log_source: "Time1",
    site_name: "BAYANGA",
    created_at: "2026-02-27T00:00:00Z",
    employee: { full_name: "Adam Taer", default_role_code: "S" },
    ...overrides,
  };
}

test("resolved legacy rows display the joined canonical employee name", () => {
  const [record] = mapCanonicalAttendanceRecords([storedPunch()]);
  assert.equal(record.employee, "Adam Taer");
  assert.equal(record.employeeId, "adam-id");
  assert.equal(record.rawBiometricName, "s adam");
  assert.equal(record.matchStatus, "MATCHED");
});

test("unresolved names are capitalized for display without replacing raw evidence", () => {
  const [record] = mapCanonicalAttendanceRecords([
    storedPunch({
      employee_id: null,
      employee_name: "  a josh m  ",
      raw_biometric_name: "a josh m",
      normalized_biometric_name: "a josh m",
      match_status: "NEEDS_REVIEW",
      employee: null,
    }),
  ]);
  assert.equal(record.employee, "A Josh M");
  assert.equal(record.rawBiometricName, "a josh m");
  assert.equal(formatBiometricDisplayName("eduardo brigole jr"), "Eduardo Brigole Jr");
});

test("confirmed aliases across sites merge into one canonical daily row", () => {
  const records = mapCanonicalAttendanceRecords([
    storedPunch(),
    storedPunch({
      id: "punch-2",
      employee_name: "skilled adam",
      raw_biometric_name: "skilled adam",
      normalized_biometric_name: "skilled adam",
      log_time: "17:00:00",
      log_type: "OUT",
      site_name: "CLIMB",
    }),
  ]);
  const rows = buildDailyRows(records);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].employee, "Adam Taer");
  assert.equal(rows[0].employeeId, "adam-id");
  assert.equal(rows[0].matchStatus, "MATCHED");
  assert.deepEqual(rows[0].sitePath, ["BAYANGA", "CLIMB"]);
});

test("an unconfirmed alias stays reviewable without contaminating canonical identity", () => {
  const canonical = mapCanonicalAttendanceRecords([storedPunch()])[0];
  const unresolved = {
    ...canonical,
    id: "punch-review",
    employeeId: null,
    employee: "Aguid Sr",
    rawBiometricName: "Aguid Sr",
    normalizedBiometricName: "aguid sr",
    matchStatus: "NEEDS_REVIEW",
    matchSource: "REFERENCE_PDF",
    logTime: "08:05:00",
  };
  const rows = buildDailyRows([canonical, unresolved]);
  assert.equal(rows.length, 2);
  assert.equal(rows.find((row) => row.employeeId === "adam-id").matchStatus, "MATCHED");
  assert.equal(rows.find((row) => !row.employeeId).matchStatus, "NEEDS_REVIEW");
});

test("payroll coalescing never fuzzy-merges unresolved short names", () => {
  const records = [
    {
      name: "Patrick",
      employeeId: null,
      role: "UNKNOWN",
      site: "TANLEH",
      date: "2026-08-20",
      hours: 8,
    },
    {
      name: "Patrick Lorico",
      employeeId: null,
      role: "E",
      site: "XE",
      date: "2026-08-20",
      hours: 8,
    },
  ];

  const coalesced = coalescePayrollAttendanceInputs(records);
  assert.deepEqual(coalesced.map((record) => record.name), [
    "Patrick",
    "Patrick Lorico",
  ]);
});

test("payroll display groups different site rows by canonical employee ID", () => {
  const base = {
    id: "adam-bayanga",
    worker: "Adam Taer",
    employeeId: "adam-id",
    role: "S",
    site: "BAYANGA",
    date: "2026-08-20 to 2026-08-26",
    hoursWorked: 8,
    overtimeHours: 0,
    defaultRate: 62.5,
    customRate: null,
    rate: 62.5,
    regularPay: 500,
    overtimePay: 0,
    totalPay: 500,
  };
  const grouped = groupByEmployee(
    [base, { ...base, id: "adam-xe", worker: "skilled adam", role: "L", site: "XE" }],
    "name-asc",
  );

  assert.equal(grouped.length, 1);
  assert.equal(grouped[0].name, "Adam Taer");
  assert.equal(grouped[0].sites.length, 2);
});
