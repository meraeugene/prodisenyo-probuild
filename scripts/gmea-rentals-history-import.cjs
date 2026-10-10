#!/usr/bin/env node
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("xlsx");
const { loadEnvConfig } = require("@next/env");
const { createClient } = require("@supabase/supabase-js");
const { deduplicate, flagCrossPeriodIssues } = require("./lib/rentalHistoryRecordReview.cjs");
const { readRentalImportTable } = require("./lib/readGmeaRentalImportState.cjs");

const aliases = new Map(Object.entries({
  YELLOW: "Yellow Dump Truck",
  "YELLOW DUMP": "Yellow Dump Truck",
  "YELLOW DUMPTRUCK": "Yellow Dump Truck",
  RED: "Red Mini Dump Truck",
  "RED MINI DUMP": "Red Mini Dump Truck",
  "REE MINI DUMP": "Red Mini Dump Truck",
  CANTER: "Canter",
  "WHITE DUMP": "White Mini Dump Truck",
  "WHITE MINI DUMP": "White Mini Dump Truck",
  FORWARD: "Forward",
  "BACKHOE VOLVO": "Backhoe Volvo",
  "BACKHOE XCMG": "Backhoe XCMG",
  BONGGO: "Bongo",
  BONGO: "Bongo",
  MIXER: "Concrete Mixer",
  "MOTOR BEJERANCE": "Motor Bejerance",
  "TOYOTA WIGO": "Toyota Wigo",
  "MOTOR HESUS": "Motor Hesus",
  "REINA CAR": "Reina Car",
}));
const noEquipment = new Set([
  "MISCELLANEOUS", "OTHERS", "MOTOR BEJERANCE & OTHERS",
]);
const uncertainEquipment = new Set(["ANA", "ESTRADA"]);
const months = new Map(Object.entries({
  JAN: 1, JANUARY: 1,
  FEB: 2, FEBRUARY: 2, FEBRARUAY: 2, FEBRAUARY: 2,
  MAR: 3, MARCH: 3, APR: 4, APRIL: 4, MAY: 5,
  JUN: 6, JUNE: 6, JUL: 7, JULY: 7, AUG: 8, AUGUST: 8,
  SEP: 9, SEPT: 9, SEPTEMBER: 9, OCT: 10, OCTOBER: 10,
  NOV: 11, NOVEMBER: 11, DEC: 12, DECEMBER: 12,
}));
const clean = (v) => String(v ?? "")
  .replace(/^\s*"|"\s*$/g, "").replace(/\s+/g, " ").trim();
const norm = (v) => clean(v).toUpperCase()
  .replace(/[^A-Z0-9&]+/g, " ").replace(/\s+/g, " ").trim();
const token = (v) => clean(v).toUpperCase().replace(/[^A-Z]/g, "");
const sha = (v) => crypto.createHash("sha256").update(v).digest("hex");
const cell = (s, r, c) => s[XLSX.utils.encode_cell({ r, c })]?.v ?? null;
const address = (r, c) => XLSX.utils.encode_cell({ r, c });

function money(v) {
  if (typeof v === "number") {
    return Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
  }
  if (v == null || v === "") return null;
  const source = clean(v);
  const number = Number(source.replace(/[(),PHP$\s]/gi, "").replace(/,/g, ""));
  if (!Number.isFinite(number)) return null;
  return Math.round((/^\(.*\)$/.test(source) ? -number : number) * 100) / 100;
}

function uuid(seed) {
  const h = sha(seed).slice(0, 32).split("");
  h[12] = "5";
  h[16] = ["8", "9", "a", "b"][parseInt(h[16], 16) % 4];
  return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16),
    h.slice(16, 20), h.slice(20)].map((x) => x.join("")).join("-");
}

function isoDate(y, m, d) {
  const value = new Date(Date.UTC(y, m - 1, d));
  if (value.getUTCFullYear() !== y || value.getUTCMonth() + 1 !== m ||
      value.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const contextualDateCorrections = new Map(Object.entries({
  "2025-03-01|003-10-25": "2025-03-10",
  "2025-03-01|003-11-25": "2025-03-11",
  "2025-06-01|6/302025": "2025-06-30",
  "2025-06-01|6/62025": "2025-06-06",
  "2025-06-01|6/72025": "2025-06-07",
  "2025-07-01|7//312025": "2025-07-31",
  "2026-01-01|FEB 31,2026": "2026-01-31",
  "2026-06-01|6/230/2026": "2026-06-30",
  "2026-09-01|09/10226": "2026-09-10",
}));

function parseDate(v, sourceMonth = null) {
  if (v instanceof Date && !Number.isNaN(v.valueOf())) {
    return { date: isoDate(v.getFullYear(), v.getMonth() + 1,
      v.getDate()), error: null };
  }
  if (typeof v === "number") {
    const p = XLSX.SSF.parse_date_code(v);
    const date = p && isoDate(p.y, p.m, p.d);
    return date ? { date, error: null } :
      { date: null, error: "invalid Excel date serial" };
  }
  const source = clean(v).replace(/\s*,\s*/g, ",").replace(/\s+/g, " ");
  if (!source) return { date: null, error: "missing date" };
  const corrected = contextualDateCorrections.get(
    `${sourceMonth}|${source.toUpperCase()}`,
  );
  if (corrected) {
    return { date: corrected, error: null,
      correction: `context correction: ${source} -> ${corrected}` };
  }
  if (/\d\s*\/\s*\d/.test(source) && /[A-Za-z]/.test(source)) {
    return { date: null, error: "ambiguous multiple-day date" };
  }
  let match = source.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2}|\d{4})$/);
  if (match) {
    const y = +match[3] < 100 ? 2000 + +match[3] : +match[3];
    const date = isoDate(y, +match[1], +match[2]);
    return date ? { date, error: null } :
      { date: null, error: "invalid calendar date" };
  }
  match = source.match(
    /^([A-Za-z]+)\s*(\d{1,2})(?:ST|ND|RD|TH)?(?:,|\s)+\s*(\d{4})$/i,
  );
  if (match) {
    const m = months.get(match[1].toUpperCase());
    const date = m && isoDate(+match[3], m, +match[2]);
    return date ? { date, error: null } :
      { date: null, error: "invalid calendar date" };
  }
  return { date: null, error: "unrecognized date format" };
}

function reportMonth(name) {
  const value = norm(name);
  const year = value.match(/20\d{2}/)?.[0];
  const words = value.split(" ");
  const word = [...months.keys()]
    .sort((a, b) => b.length - a.length)
    .find((part) => words.includes(part) || value.startsWith(part));
  const month = months.get(word);
  return year && month
    ? `${year}-${String(month).padStart(2, "0")}-01`
    : null;
}

function category(description) {
  const value = norm(description);
  if (value === "ATF") return { name: "Maintenance", error: null };
  const historicalMiscellaneous = new Set([
    "", "DIESEL ALLO FOOD", "DIESEL ALLO FOOD BUTUAN",
    "DIESEL ALLO", "MAINT ALLO", "DIESEL & OTHERS",
    "ELECTRICAL", "STICKER", "AYAGAN", "1500",
  ]);
  if (historicalMiscellaneous.has(value)) {
    return { name: "Miscellaneous", error: null };
  }
  const found = new Set();
  if (/\b(DIESEL|FUEL)\b/.test(value)) found.add("Diesel/Fuel");
  if (/\bGAS(OLINE)?\b/.test(value)) found.add("Gasoline");
  if (/\b(MAINT|MAINTENANCE|MAINTENACE|MAINTENCE)\b/.test(value)) {
    found.add("Maintenance");
  }
  if (/\b(REPAIR|WELD|VULCANI[ZS]E|OVERHAUL)\b/.test(value)) {
    found.add("Repair");
  }
  if (/\b(PART|PARTS|TIRE|TYRE|BATTERY|FILTER|BEARING|BELT|HOSE)\b/
    .test(value)) found.add("Parts");
  if (/\b(REGISTRATION|RENEWAL|LTO)\b/.test(value)) {
    found.add("Registration/Renewal");
  }
  if (/^RENEW$/.test(value)) found.add("Registration/Renewal");
  if (/\bDRIVER(S)?\b/.test(value)) found.add("Driver");
  if (/\bOPERATOR(S)?\b/.test(value)) found.add("Operator");
  if (/\b(SALARY|LABOR|LABOUR|WAGE|PAYROLL|ADMIN|MARIEGEN|MAEIEGEN)\b/
    .test(value)) found.add("Labor");
  if (/\b(CASH ADVANCE|CA)\b/.test(value)) found.add("Cash Advance");
  if (/\b(MISC|MISCELLANEOUS|OTHER|OTHERS|ALLOWANCE|ALLO|FOOD|MEALS?)\b/
    .test(value)) found.add("Miscellaneous");
  if (/\b(RICE|OFFICE SUPPLY|MEDICINE|INSURANCE)\b/.test(value)) {
    found.add("Miscellaneous");
  }
  if (/^GASOL$/.test(value)) found.add("Gasoline");
  if (found.size === 1) return { name: [...found][0], error: null };
  return { name: null, error: found.size
    ? `mixed categories: ${[...found].join(", ")}`
    : "unrecognized category" };
}

function equipment(heading) {
  const value = norm(heading);
  if (noEquipment.has(value)) return { name: null, error: null };
  if (uncertainEquipment.has(value)) {
    return { name: null, error: "uncertain equipment heading" };
  }
  if (aliases.has(value)) return { name: aliases.get(value), error: null };
  return { name: null, error: "unknown equipment heading" };
}

function makeRecord(input) {
  const parsed = parseDate(input.rawDate, input.sourceMonth);
  const issues = [...(input.issues || [])];
  if (!parsed.date) issues.push(`date: ${parsed.error}`);
  if (!input.category) issues.push("unknown category");
  const locator = `${input.sheet}!${input.address}:${input.kind}`;
  const payload = {
    ...input,
    date: parsed.date,
    rawDate: clean(input.rawDate),
    rawEquipment: clean(input.rawEquipment),
    rawDescription: clean(input.rawDescription),
    amount: money(input.amount),
    dateCorrection: parsed.correction || null,
    issues: undefined,
  };
  const fingerprint = sha(JSON.stringify(payload));
  return { ...payload, sourceLocator: locator,
    sourceFingerprint: fingerprint,
    id: uuid(`expense:${locator}:${fingerprint}`),
    issues: [...new Set(issues)] };
}

function equipmentGroups(sheet) {
  if (!sheet["!ref"]) return [];
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  for (let row = range.s.r;
    row <= Math.min(range.e.r, range.s.r + 20); row += 1) {
    const groups = [];
    for (let column = range.s.c; column <= range.e.c - 2; column += 1) {
      if (norm(cell(sheet, row, column)) === "AMOUNT" &&
          ["DATE", "0DATE"].includes(norm(cell(sheet, row, column + 1))) &&
          norm(cell(sheet, row, column + 2)) === "REMARK") {
        groups.push({ column, headerRow: row,
          heading: clean(cell(sheet, row - 1, column)) });
        column += 2;
      }
    }
    if (groups.length) return groups;
  }
  return [];
}

function parseEquipmentSheet(name, sheet) {
  const groups = equipmentGroups(sheet);
  const records = [], controls = [];
  if (!groups.length) {
    return { records, controls, errors: ["equipment headers not found"] };
  }
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  for (const group of groups) {
    const mappedEquipment = equipment(group.heading);
    for (let row = group.headerRow + 1; row <= range.e.r; row += 1) {
      const amount = money(cell(sheet, row, group.column));
      if (amount == null || amount <= 0) continue;
      const rawDate = cell(sheet, row, group.column + 1);
      const description = cell(sheet, row, group.column + 2);
      if (!clean(rawDate) && !clean(description)) {
        controls.push({ sheet: name, cell: address(row, group.column),
          amount, reason: "amount-only subtotal" });
        continue;
      }
      const mappedCategory = category(description);
      const issues = [];
      if (mappedEquipment.error) {
        issues.push(`equipment: ${mappedEquipment.error}`);
      }
      if (mappedCategory.error) {
        issues.push(`category: ${mappedCategory.error}`);
      }
      records.push(makeRecord({
        kind: "monthly-equipment",
        sheet: name,
        sourceMonth: reportMonth(name),
        address: address(row, group.column),
        rawDate,
        rawEquipment: group.heading,
        rawDescription: description,
        amount,
        category: mappedCategory.name,
        equipment: mappedEquipment.name,
        payee: "",
        issues,
      }));
    }
  }
  return { records, controls, errors: [] };
}

function parseWeeklySheet(name, sheet, sourceMonth = reportMonth(name)) {
  const records = [], expenseControls = [];
  if (!sheet["!ref"]) {
    return { records, expenseControls, markers: 0,
      errors: ["empty weekly sheet"] };
  }
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  let markers = 0;
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const markerToken = token(cell(sheet, row, column));
      if (/^TOTAL\s*EXPENSES/.test(norm(cell(sheet, row, column)))) {
        const value = findRightNumber(sheet, row, column,
          Math.min(column + 6, range.e.c));
        if (value) expenseControls.push({ month: sourceMonth,
          amount: value.amount, sheet: name, labelCell: address(row, column),
          amountCell: value.cell });
      }
      if (!["CA", "CASHADVANCE", "SALARY"].includes(markerToken)) continue;
      markers += 1;
      const kind = markerToken === "SALARY" ? "salary" : "cash-advance";
      const rawDate = cell(sheet, row, column - 1);
      const thirteenth = norm(cell(sheet, row, column + 1))
        .startsWith("13TH");
      let seenDetail = false;
      for (let detail = row + 1;
        detail <= Math.min(row + 9, range.e.r); detail += 1) {
        const label = clean(cell(sheet, detail, column - 1));
        const labelNorm = norm(label);
        const next = token(cell(sheet, detail, column));
        const amount = money(cell(sheet, detail, column));
        if (seenDetail && !label && amount == null) break;
        if (["CA", "CASHADVANCE", "SALARY"].includes(next) ||
            /^TOTAL/.test(labelNorm)) break;
        let mappedCategory = "Labor";
        if (kind === "cash-advance") mappedCategory = "Cash Advance";
        else if (/^DRIVERS?$/.test(labelNorm)) mappedCategory = "Driver";
        else if (/^OPERATORS?$/.test(labelNorm)) mappedCategory = "Operator";
        const add = (recordAmount, targetColumn, recordKind, description) => {
          if (!(recordAmount > 0) || !label) return;
          seenDetail = true;
          records.push(makeRecord({
            kind: recordKind,
            sheet: name,
            sourceMonth,
            address: address(detail, targetColumn),
            rawDate,
            rawEquipment: "",
            rawDescription: description,
            amount: recordAmount,
            category: mappedCategory,
            equipment: null,
            payee: label,
          }));
        };
        add(amount, column,
          `weekly-${kind}`, kind === "cash-advance"
            ? `Cash Advance - ${label}` : `Salary - ${label}`);
        if (thirteenth) {
          add(money(cell(sheet, detail, column + 1)), column + 1,
            "weekly-13th-month", `13th Month - ${label}`);
        }
      }
    }
  }
  return { records, expenseControls, markers, errors: [] };
}

function findRightNumber(sheet, row, start, end) {
  for (let column = start + 1; column <= end; column += 1) {
    const amount = money(cell(sheet, row, column));
    if (amount != null) return { amount, cell: address(row, column) };
  }
  return null;
}

function parseSummarySheet(name, sheet, sourceMonth = reportMonth(name)) {
  if (!sheet["!ref"]) return { summary: null, income: null };
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  let summary = null, income = null;
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const text = norm(cell(sheet, row, column));
      const value = findRightNumber(sheet, row, column, range.e.c);
      if (/TOTAL AMOUNT EXPENSE/.test(text) && value) {
        summary = { month: sourceMonth, amount: value.amount,
          sheet: name, amountCell: value.cell };
      }
      if (/INCOME RENT/.test(text) && value) {
        const locator = `${name}!${value.cell}:historical-income`;
        const fingerprint = sha(JSON.stringify({
          month: sourceMonth, amount: value.amount,
          sheet: name, cell: value.cell,
        }));
        income = { id: uuid(`income:${locator}:${fingerprint}`),
          month: sourceMonth, amount: value.amount, sheet: name,
          amountCell: value.cell, sourceLocator: locator,
          sourceFingerprint: fingerprint };
      }
    }
  }
  return { summary, income };
}

async function databaseState(enabled) {
  if (!enabled) {
    return { connected: false, reason: "disabled",
      equipment: [], categories: [], expenses: [] };
  }
  loadEnvConfig(process.cwd());
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { connected: false, reason: "missing Supabase environment",
      equipment: [], categories: [], expenses: [] };
  }
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const [equipmentRows, categoryRows, expenseRows] = await Promise.all([
    readRentalImportTable(db, "gmea_rental_equipment"),
    readRentalImportTable(db, "gmea_rental_expense_categories"),
    readRentalImportTable(db, "gmea_rental_expenses"),
  ]);
  return { connected: true, db, equipment: equipmentRows,
    categories: categoryRows, expenses: expenseRows };
}

function compareDatabase(records, database) {
  const normalizeName = (v) => norm(v).replace(/\bTRUCK\b/g, "").trim();
  const existingEquipment = new Map(database.equipment.map(
    (item) => [normalizeName(item.name), item],
  ));
  const categories = new Set(database.categories
    .filter((item) => item.is_active).map((item) => norm(item.name)));
  const fingerprints = new Set();
  for (const item of database.expenses) {
    const match = String(item.notes || "")
      .match(/source-fingerprint:([a-f0-9]{64})/i);
    if (match) fingerprints.add(match[1].toLowerCase());
  }
  const planned = new Map();
  for (const item of records) {
    if (item.equipment) {
      const current = existingEquipment.get(normalizeName(item.equipment));
      item.equipmentId = current?.id || null;
      if (!current) {
        const code = "HIST-" + norm(item.equipment)
          .replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
        planned.set(item.equipment, { name: item.equipment, code,
          equipmentType: "Other", status: "inactive" });
      }
    } else item.equipmentId = null;
    if (item.category && !categories.has(norm(item.category))) {
      item.issues.push("category is not active in the database");
    }
    item.databaseDuplicate = fingerprints.has(item.sourceFingerprint);
  }
  return [...planned.values()];
}

const issueView = (item) => ({
  sheet: item.sheet,
  cell: item.address,
  date: item.rawDate,
  equipment: item.rawEquipment,
  description: item.rawDescription,
  amount: item.amount,
  issues: item.issues,
});

function summarize(input) {
  const { records, duplicates, summaries, incomes, database } = input;
  const existingDuplicates = records.filter((x) => x.databaseDuplicate);
  const ready = records.filter((x) =>
    !x.databaseDuplicate && x.issues.length === 0);
  const invalidDates = records.filter((x) =>
    x.issues.some((issue) => issue.startsWith("date:")));
  const unknownEquipment = records.filter((x) =>
    x.issues.some((issue) => issue.startsWith("equipment:")));
  const unknownCategories = records.filter((x) =>
    x.issues.some((issue) => issue.startsWith("category:") ||
      issue === "unknown category" || issue.includes("category is not active")));
  const conflicts = records.filter((x) =>
    x.issues.includes("conflicting duplicate/revision in weekly sheet"));
  const blockedByDate = records.filter((x) =>
    !x.databaseDuplicate &&
    x.issues.some((issue) => issue.startsWith("date:")));
  const blockedOther = records.filter((x) =>
    !x.databaseDuplicate && x.issues.length > 0 &&
    !x.issues.some((issue) => issue.startsWith("date:")));
  const categoryTotals = {
    Labor: 0, Driver: 0, Operator: 0, "Cash Advance": 0,
  };
  const monthly = {}, monthlyEquipment = {}, weeklyAdjustments = {};
  const readyMonthly = {};
  for (const item of records.filter((x) => !x.databaseDuplicate)) {
    if (categoryTotals[item.category] != null) {
      categoryTotals[item.category] += item.amount;
    }
    monthly[item.sourceMonth || "unknown"] =
      (monthly[item.sourceMonth || "unknown"] || 0) + item.amount;
    const bucket = item.kind === "monthly-equipment"
      ? monthlyEquipment : weeklyAdjustments;
    bucket[item.sourceMonth || "unknown"] =
      (bucket[item.sourceMonth || "unknown"] || 0) + item.amount;
  }
  for (const key of Object.keys(monthly)) monthly[key] = money(monthly[key]);
  for (const bucket of [monthlyEquipment, weeklyAdjustments]) {
    for (const key of Object.keys(bucket)) bucket[key] = money(bucket[key]);
  }
  for (const key of Object.keys(categoryTotals)) {
    categoryTotals[key] = money(categoryTotals[key]);
  }
  for (const item of ready) {
    readyMonthly[item.sourceMonth || "unknown"] =
      (readyMonthly[item.sourceMonth || "unknown"] || 0) + item.amount;
  }
  for (const key of Object.keys(readyMonthly)) {
    readyMonthly[key] = money(readyMonthly[key]);
  }
  const reconciliation = summaries.map((summary) => {
    const extracted = monthly[summary.month] || 0;
    const difference = money(extracted - summary.amount);
    const weeklyControlTotal = money(input.weeklyExpenseControls
      .filter((x) => x.month === summary.month)
      .reduce((total, x) => total + x.amount, 0));
    const controlDifference = money(weeklyControlTotal - summary.amount);
    return { month: summary.month, summaryAmount: summary.amount,
      extractedAmount: extracted, difference,
      monthlyEquipmentAmount: monthlyEquipment[summary.month] || 0,
      weeklyAdjustmentAmount: weeklyAdjustments[summary.month] || 0,
      importableAmount: readyMonthly[summary.month] || 0,
      weeklyControlTotal, controlDifference,
      matches: Math.abs(difference) < 0.01,
      source: `${summary.sheet}!${summary.amountCell}` };
  });
  return {
    mode: "DRY RUN",
    workbook: input.workbook,
    database: { connected: database.connected,
      reason: database.reason || null,
      existingEquipment: database.equipment.length,
      existingCategories: database.categories.length,
      existingExpenses: database.expenses.length },
    sheets: input.inventory,
    totals: { recordsFound: records.length + duplicates.length,
      uniqueRecords: records.length, readyForImport: ready.length,
      skippedDuplicates: duplicates.length + existingDuplicates.length,
      workbookDuplicates: duplicates.length,
      existingDatabaseDuplicates: existingDuplicates.length,
      conflictingRevisions: conflicts.length,
      invalidOrAmbiguousDates: invalidDates.length,
      unknownEquipment: unknownEquipment.length,
      unknownCategories: unknownCategories.length,
      blockedByUnresolvedDate: blockedByDate.length,
      blockedForAnotherReason: blockedOther.length,
      possibleCrossPeriodDuplicateGroups: input.crossPeriodDuplicates.length,
      blockedRecords: blockedByDate.length + blockedOther.length,
      skippedSubtotalControls: input.controls.length },
    categoryTotals: {
      labor: categoryTotals.Labor,
      driver: categoryTotals.Driver,
      operator: categoryTotals.Operator,
      cashAdvance: categoryTotals["Cash Advance"],
    },
    expensesByMonth: monthly,
    importableExpensesByMonth: readyMonthly,
    importableExpenseTotal: money(ready.reduce(
      (total, item) => total + item.amount, 0)),
    monthlyEquipmentByMonth: monthlyEquipment,
    weeklyAdjustmentsByMonth: weeklyAdjustments,
    historicalIncomeByMonth: Object.fromEntries(
      incomes.map((x) => [x.month, x.amount])),
    reconciliation,
    plannedEquipment: input.plannedEquipment,
    invalidDates: invalidDates.map(issueView),
    correctedDates: records.filter((x) => x.dateCorrection).map((x) => ({
      ...issueView(x), correctedDate: x.date,
      correction: x.dateCorrection,
    })),
    unknownEquipment: unknownEquipment.map(issueView),
    unknownCategories: unknownCategories.map(issueView),
    conflictingRevisions: conflicts.map(issueView),
    crossPeriodDuplicates: input.crossPeriodDuplicates.map(group => group.map(issueView)),
    duplicateRecords: duplicates.map((x) => ({
      ...issueView(x), duplicateOf: x.duplicateOf,
    })),
    unreadableSheets: input.inventory.filter((x) => x.errors.length),
    readyRecords: ready,
    incomes,
  };
}

function parseArgs(values) {
  const args = { workbook: path.resolve("data", "ALL EXPENSES.xlsx"),
    dryRun: true, json: false, database: true, actor: null, confirm: null };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--workbook") args.workbook = path.resolve(values[++index]);
    else if (value === "--json") args.json = true;
    else if (value === "--no-database") args.database = false;
    else if (value === "--dry-run") args.dryRun = true;
    else if (value === "--apply") args.dryRun = false;
    else if (value === "--actor") args.actor = values[++index];
    else if (value === "--confirm") args.confirm = values[++index];
    else throw new Error(`Unknown argument: ${value}`);
  }
  return args;
}

function printReport(report) {
  console.log("GMEA Rentals historical migration - DRY RUN");
  console.log(`Workbook: ${report.workbook.path}`);
  for (const [key, value] of Object.entries(report.totals)) {
    console.log(`${key}: ${value}`);
  }
  console.log("\nCategory totals");
  for (const [key, value] of Object.entries(report.categoryTotals)) {
    console.log(`${key}: ${value.toFixed(2)}`);
  }
  console.log("\nExpenses by report month");
  for (const [key, value] of Object.entries(report.expensesByMonth)) {
    console.log(`${key}: ${value.toFixed(2)}`);
  }
  console.log("\nHistorical income by month");
  for (const [key, value] of Object.entries(report.historicalIncomeByMonth)) {
    console.log(`${key}: ${value.toFixed(2)}`);
  }
  console.log("\nImportable historical expenses");
  console.log(`total: ${report.importableExpenseTotal.toFixed(2)}`);
  for (const [key, value] of Object.entries(
    report.importableExpensesByMonth,
  )) {
    console.log(`${key}: ${value.toFixed(2)}`);
  }
  console.log("\nSummary reconciliation");
  for (const row of report.reconciliation) {
    console.log(`${row.month}: summary=${row.summaryAmount.toFixed(2)} ` +
      `extracted=${row.extractedAmount.toFixed(2)} ` +
      `importable=${row.importableAmount.toFixed(2)} ` +
      `difference=${row.difference.toFixed(2)} ` +
      (row.matches ? "MATCH" : "MISMATCH"));
  }
}

async function applyImport(report, database, args) {
  if (args.confirm !== "APPLY_GMEA_RENTALS_HISTORY") {
    throw new Error(
      "Apply mode requires --confirm APPLY_GMEA_RENTALS_HISTORY.",
    );
  }
  if (!/^[0-9a-f-]{36}$/i.test(args.actor || "")) {
    throw new Error("Apply mode requires a valid --actor UUID.");
  }
  const blocking = report.totals.blockedRecords;
  if (blocking) {
    throw new Error(`Apply blocked: ${blocking} records require review.`);
  }
  if (!database.connected) {
    throw new Error("Apply mode requires a configured Supabase connection.");
  }
  const calls = [];
  for (const item of report.plannedEquipment) {
    calls.push({ kind: "equipment",
      source_locator: `equipment:${item.code}`,
      source_fingerprint: sha(JSON.stringify(item)),
      id: uuid(`equipment:${item.code}`), ...item });
  }
  calls.push(...report.readyRecords.map((x) => ({ kind: "expense", ...x })));
  calls.push(...report.incomes.map((x) => ({ kind: "income", ...x })));
  for (const item of calls) {
    const result = await database.db.rpc(
      "import_gmea_rental_history_record",
      { p_actor: args.actor, p_record: item },
    );
    if (result.error) {
      throw new Error(
        `Import failed at ${item.sourceLocator || item.source_locator}: ` +
        result.error.message,
      );
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(args.workbook)) {
    throw new Error(`Workbook not found: ${args.workbook}`);
  }
  const bytes = fs.readFileSync(args.workbook);
  const workbook = XLSX.read(bytes, {
    type: "buffer",
    cellDates: true,
    cellFormula: true,
    cellNF: true,
  });
  const inventory = [], summaries = [], incomes = [], controls = [];
  const weeklyExpenseControls = [];
  let records = [];
  let activeMonth = null;
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    let type = "equipment";
    if (/WEEK/i.test(name)) type = "weekly";
    else if (/MONTH|MOTH/i.test(name)) type = "summary";
    else if (!sheet["!ref"]) type = "empty";
    const entry = { name, type, range: sheet["!ref"] || null,
      records: 0, errors: [] };
    if (type === "equipment") {
      activeMonth = reportMonth(name) || activeMonth;
      const parsed = parseEquipmentSheet(name, sheet);
      records.push(...parsed.records);
      controls.push(...parsed.controls);
      entry.records = parsed.records.length;
      entry.errors = parsed.errors;
    } else if (type === "weekly") {
      const parsed = parseWeeklySheet(name, sheet,
        reportMonth(name) || activeMonth);
      records.push(...parsed.records);
      weeklyExpenseControls.push(...parsed.expenseControls);
      entry.records = parsed.records.length;
      entry.markers = parsed.markers;
      entry.errors = parsed.errors;
    } else if (type === "summary") {
      const parsed = parseSummarySheet(name, sheet,
        reportMonth(name) || activeMonth);
      if (parsed.summary) summaries.push(parsed.summary);
      if (parsed.income) incomes.push(parsed.income);
    }
    inventory.push(entry);
  }
  const deduped = deduplicate(records);
  records = deduped.records;
  const crossPeriodDuplicates = flagCrossPeriodIssues(records);
  const database = await databaseState(args.database);
  const plannedEquipment = compareDatabase(records, database);
  const report = summarize({
    workbook: { path: args.workbook, sha256: sha(bytes) },
    inventory,
    records,
    duplicates: deduped.duplicates,
    crossPeriodDuplicates,
    summaries,
    incomes,
    controls,
    weeklyExpenseControls,
    database,
    plannedEquipment,
  });
  if (!args.dryRun) await applyImport(report, database, args);
  if (args.json) console.log(JSON.stringify(report, null, 2));
  else printReport(report);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
