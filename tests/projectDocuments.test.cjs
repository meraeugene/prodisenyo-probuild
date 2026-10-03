const load = require("./helpers/loadGmeaModule.cjs");
const test = require("node:test");
const assert = require("node:assert/strict");

function loadUtility() {
  return load("features/project-documents/utils/documentValidation.ts");
}

const utility = loadUtility();

test("accepts supported project documents", () => {
  assert.equal(utility.validateProjectDocument({ name: "plan.pdf", size: 1024, type: "application/pdf" }), "plan.pdf");
});

test("rejects oversized and unsupported project documents", () => {
  assert.throws(() => utility.validateProjectDocument({ name: "plan.pdf", size: 11 * 1024 * 1024, type: "application/pdf" }), /10 MB/);
  assert.throws(() => utility.validateProjectDocument({ name: "script.exe", size: 100, type: "application/octet-stream" }), /PDF/);
});

test("normalizes categories and storage file names", () => {
  assert.equal(utility.parseProjectDocumentCategory("plans"), "plans");
  assert.equal(utility.parseProjectDocumentCategory("unknown"), "other");
  assert.equal(utility.sanitizeStorageFileName(" Site Plan (Final).pdf "), "Site-Plan-Final-.pdf");
});

