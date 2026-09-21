const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");

const {
  normalizeBiometricAlias,
  normalizeBiometricComparison,
  resolveBiometricIdentity,
} = load("features/attendance/utils/biometricIdentity.ts");

const employees = [
  { id: "aidan", full_name: "Aidan Tundag" },
  { id: "jereck", full_name: "Jereck Gamayon" },
  { id: "jose", full_name: "Jose Subingsubing" },
  { id: "vincent", full_name: "Vincent Subingsubing" },
];

test("normalizes spacing, case, punctuation, and comparison prefixes", () => {
  assert.equal(normalizeBiometricAlias(" L JERECK "), "l jereck");
  assert.equal(normalizeBiometricAlias("lJereck"), "l jereck");
  assert.equal(
    normalizeBiometricComparison("labor jereck gamayon"),
    "jereck gamayon",
  );
});

test("confirmed aliases resolve to the canonical database employee", () => {
  const result = resolveBiometricIdentity("PA Aidan", employees, [
    {
      employee_id: "aidan",
      normalized_alias: "pa aidan",
      confirmed: true,
      match_source: "MANUAL",
    },
  ]);
  assert.equal(result.status, "MATCHED");
  assert.equal(result.employeeId, "aidan");
  assert.equal(result.officialName, "Aidan Tundag");
});

test("confirmed Warguez variants resolve to Ryan Warguez", () => {
  const warguezEmployees = [{ id: "ryan", full_name: "Ryan Warguez" }];
  const aliases = [
    "elec novbryan warguez",
    "nov ryan warguez",
    "ryan warguez warguez",
  ].map((normalized_alias) => ({
    employee_id: "ryan",
    normalized_alias,
    confirmed: true,
    match_source: "MANUAL",
  }));

  for (const rawName of [
    "Elec Novbryan Warguez",
    "Nov ryan Warguez",
    "Ryan Warguez Warguez",
  ]) {
    const result = resolveBiometricIdentity(rawName, warguezEmployees, aliases);
    assert.equal(result.status, "MATCHED");
    assert.equal(result.employeeId, "ryan");
    assert.equal(result.officialName, "Ryan Warguez");
  }
});

test("exact full names resolve but first names remain review items", () => {
  assert.equal(
    resolveBiometricIdentity("JERECK GAMAYON", employees, []).status,
    "MATCHED",
  );
  const candidate = resolveBiometricIdentity("Aidan", employees, []);
  assert.equal(candidate.status, "NEEDS_REVIEW");
  assert.equal(candidate.employeeId, null);
  assert.equal(candidate.suggestedEmployeeId, "aidan");
});

test("ambiguous surnames never auto-match", () => {
  const result = resolveBiometricIdentity("Sobingsobing", employees, []);
  assert.equal(result.status, "NEEDS_REVIEW");
  assert.equal(result.employeeId, null);
});

test("a unique full-name spelling variant resolves automatically", () => {
  const result = resolveBiometricIdentity(
    "Jonald Okariza",
    [{ id: "jonald", full_name: "Jonald Ocariza" }],
    [],
  );
  assert.equal(result.status, "MATCHED");
  assert.equal(result.employeeId, "jonald");
  assert.equal(result.officialName, "Jonald Ocariza");
});

test("short names and initials remain review suggestions", () => {
  const result = resolveBiometricIdentity(
    "skilled jonald o",
    [{ id: "jonald", full_name: "Jonald Ocariza" }],
    [],
  );
  assert.equal(result.status, "NEEDS_REVIEW");
  assert.equal(result.employeeId, null);
  assert.equal(result.suggestedEmployeeId, "jonald");
});

test("unconfirmed reference mappings block polluted exact-name matches", () => {
  const result = resolveBiometricIdentity(
    "Angelo Saboclao",
    [
      { id: "raw", full_name: "Angelo Saboclao" },
      { id: "canonical", full_name: "Angelo Sabocdalao" },
    ],
    [
      {
        employee_id: "canonical",
        normalized_alias: "angelo saboclao",
        confirmed: false,
        match_source: "REFERENCE_PDF",
      },
    ],
  );
  assert.equal(result.status, "NEEDS_REVIEW");
  assert.equal(result.employeeId, null);
  assert.equal(result.officialName, null);
  assert.equal(result.suggestedEmployeeId, "canonical");
  assert.equal(result.suggestedOfficialName, "Angelo Sabocdalao");
});
