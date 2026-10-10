const fs = require("node:fs"), crypto = require("node:crypto"), X = require("xlsx");
const months = { AUGUST: 8, SEPTEMBER: 9, OCT: 10, OCTOBER: 10 };
const clean = value => String(value ?? "").replace(/"/g, "").trim();
const cents = value => Math.round(Number(String(value).replace(/[,\s]/g, "")) * 100);
const iso = (month, day) => `2026-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
function sourceDate(value) {
  const match = clean(value).match(/^([A-Za-z]+)\s*(\d{1,2})\s*,\s*(2026)$/);
  if (!match || !months[match[1].toUpperCase()]) throw new Error(`Invalid weekly expense date: ${value}`);
  return iso(months[match[1].toUpperCase()], +match[2]);
}
function mergedValue(sheet, row, col) {
  const direct = sheet[X.utils.encode_cell({r: row,c: col})]?.v;
  if (direct != null && direct !== "") return direct;
  const merge = (sheet["!merges"] || []).find(item => row >= item.s.r && row <= item.e.r && col >= item.s.c && col <= item.e.c);
  return merge ? sheet[X.utils.encode_cell(merge.s)]?.v : null;
}

function parseRentalWeeklySheets(workbook, sha256) {
  const weeks = [];
  for (const name of ["AUGUST WEEKLY", "SEPTEMBER WEEKLY"]) {
    const sheet = workbook.Sheets[name];
    if (!sheet?.["!ref"]) throw new Error(`Weekly source missing: ${name}`);
    const range = X.utils.decode_range(sheet["!ref"]), headers = [];
    for (let r = range.s.r; r <= range.e.r; r++) if (/EXPENSES DUMP TRUCK/i.test(clean(mergedValue(sheet, r, 3)))) headers.push(r);
    for (let index = 0; index < headers.length; index++) {
      const first = headers[index] + 1, last = (headers[index + 1] ?? range.e.r + 1) - 1;
      let label;
      for (let r = first; r <= last; r++) if (sheet[X.utils.encode_cell({r,c:2})]?.v) { label = clean(sheet[X.utils.encode_cell({r,c:2})].v); break; }
      const match = label?.match(/^([A-Za-z]+)\s*(\d{1,2})\s*-\s*(?:([A-Za-z]+)\s*)?(\d{1,2})\s*,\s*\d{3,4}$/);
      if (!match) throw new Error(`Invalid workbook week range: ${label}`);
      const start = iso(months[match[1].toUpperCase()], +match[2]), end = iso(months[(match[3] || match[1]).toUpperCase()], +match[4]);
      const week = { month: start.slice(0,7), start, end, sourceLabel: label, sourceSheet: name, rows: [], pending: [], sourceTotal: null, sourceTotalCell: null };
      let section = "equipment", groupDate = null;
      const sectionCounts = { "cash-advance": 0, salary: 0 };
      for (let r = first; r <= last; r++) {
        const description = clean(mergedValue(sheet,r,4));
        if (/^TOTAL EXPENSES/i.test(clean(mergedValue(sheet,r,3)))) {
          week.sourceTotal = cents(sheet[X.utils.encode_cell({r,c:6})]?.v) / 100;
          week.sourceTotalCell = X.utils.encode_cell({r,c:6}); break;
        }
        if (/^(CA|SALARY)$/i.test(description)) { section = /^CA$/i.test(description) ? "cash-advance" : "salary"; groupDate = sourceDate(mergedValue(sheet,r,3)); continue; }
        const amountCol = section === "equipment" ? 6 : 4;
        const rawAmount = sheet[X.utils.encode_cell({r,c:amountCol})]?.v;
        if (rawAmount == null || rawAmount === "") continue;
        const amount = cents(rawAmount) / 100;
        if (!Number.isFinite(amount) || amount <= 0) throw new Error(`Invalid amount: ${name} row ${r+1}`);
        const date = section === "equipment" ? sourceDate(mergedValue(sheet,r,3)) : groupDate;
        const party = clean(mergedValue(sheet,r, section === "equipment" ? 4 : 3));
        if (!party || date < start || date > end) throw new Error(`Invalid dated weekly row: ${name} row ${r+1}`);
        const cell = X.utils.encode_cell({r,c:amountCol});
        const row = { date, party, description: section === "equipment" ? clean(mergedValue(sheet,r,5)) : section === "salary" ? "Salary" : "Cash advance", amount,
          week: { month: week.month, start, end, section, party, order: r, source: { sheet: name, cell, sha256 } } };
        if (!row.description) throw new Error(`Description missing: ${name}!${cell}`);
        week.rows.push(row);
        if (section !== "equipment") sectionCounts[section]++;
      }
      week.pending = Object.keys(sectionCounts).filter(section => !sectionCounts[section]);
      week.rows.forEach(row => { row.week.pending = week.pending; });
      week.total = week.rows.reduce((sum,row) => sum+cents(row.amount),0)/100;
      week.difference = Math.round((week.total-week.sourceTotal)*100)/100;
      weeks.push(week);
    }
  }
  return weeks;
}
function readRentalWeeklyWorkbook(file) {
  const bytes = fs.readFileSync(file), sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  return { source: { path: file, sha256 }, weeks: parseRentalWeeklySheets(X.read(bytes,{type:"buffer",cellDates:false,cellFormula:true}),sha256) };
}
module.exports = { readRentalWeeklyWorkbook, parseRentalWeeklySheets };
