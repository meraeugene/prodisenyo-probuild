const assert = require("node:assert/strict"), test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");
const { parseMoneyInput, formatMoneyInput, moneyInputCaret } = load("features/gmea-forms/utils/moneyInput.ts");

test("money entry groups thousands, preserves incomplete decimals, and pads cents on blur", () => {
  for (const [raw, display] of [["", ""], ["0", "0"], ["0012345", "12,345"], ["12345.", "12,345."], ["12345.6", "12,345.6"], ["12345.67", "12,345.67"], ["-1234.5", "-1,234.5"]])
    assert.equal(formatMoneyInput(raw), display);
  assert.equal(formatMoneyInput("12345.6", true), "12,345.60");
  assert.equal(formatMoneyInput(10000000000, true), "10,000,000,000.00");
  assert.equal(formatMoneyInput("0", true), "0.00");
  assert.equal(formatMoneyInput("", true), "");
});

test("pasted amounts become ungrouped decimal strings and malformed amounts are rejected", () => {
  assert.equal(parseMoneyInput(" 1,234,567.89 "), "1234567.89");
  assert.equal(parseMoneyInput(".25"), ".25");
  assert.equal(parseMoneyInput("-1"), "-1");
  for (const raw of ["1.234", "1e6", "abc", "1.2.3", "Infinity"]) assert.equal(parseMoneyInput(raw), null);
});

test("caret offsets follow the digits across inserted grouping commas", () => {
  assert.equal(moneyInputCaret("12,345.67", 2), 2);
  assert.equal(moneyInputCaret("12,345.67", 3), 4);
  assert.equal(moneyInputCaret("1,234,567.89", 7), 9);
  assert.equal(moneyInputCaret("1,234", 0), 0);
});
