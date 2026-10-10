const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const XLSX = require("xlsx");
const { stableId } = require("./gmeaContractWorkbook.cjs");
const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

function readAmount(value) {
  if (value == null || value === "" || /^absent$/i.test(clean(value))) return null;
  if (typeof value === "number") return Math.round(value * 100) / 100;
  let text = clean(value).replace(/[₱,\s]/g, "");
  // This source uses 15.904.00 for the recorded ₱15,904.00 item.
  if (/^\d{1,3}(?:\.\d{3})+\.\d{2}$/.test(text)) {
    const last = text.lastIndexOf(".");
    text = text.slice(0, last).replace(/\./g, "") + text.slice(last);
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error(`Invalid expense amount: ${value}`);
  return Math.round(Number(text) * 100) / 100;
}

function expenseDate(value) {
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    return date ? `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}` : "";
  }
  const text = clean(value).replace(/APRIIL/gi, "April");
  const match = text.match(/^([A-Za-z]+)\s*(\d{1,2}),\s*(20\d{2})$/);
  if (!match) return ""; // Ambiguous/malformed source dates remain unknown.
  const parsed = new Date(`${match[1]} ${match[2]}, ${match[3]}`);
  if (!Number.isFinite(parsed.valueOf())) return "";
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

function category(value, description) {
  const text = clean(value).toUpperCase();
  if (/MATERIAL/.test(text)) return "Materials";
  if (/LABOR|PAYROLL|^CA$/.test(text)) return "Labor / Payroll";
  if (/MEAL/.test(text)) return "Meals";
  if (/COMMISSION/.test(text)) return "Commission";
  if (/DELIVERY/.test(text)) return "Delivery";
  if (/FUEL/.test(text)) return "Fuel";
  if (/TRANSPORT/.test(text)) return "Transport";
  if (/OPERATION/.test(text)) return "Operations";
  if (/LABOR|MANPOWER/i.test(description)) return "Labor / Payroll";
  return "Other";
}

function readMonitoringWorkbook(filename) {
  const bytes = fs.readFileSync(filename);
  const workbook = XLSX.read(bytes, { type: "buffer" });
  const source = { workbook: path.basename(filename), sha256: crypto.createHash("sha256").update(bytes).digest("hex"), imported_at: new Date().toISOString() };
  const sheets = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const header = Object.entries(sheet).find(([address, cell]) => !address.startsWith("!") && clean(cell.v).toUpperCase() === "EXPENSES DESCRIPTION");
    if (!header) throw new Error(`No expense table in ${name}.`);
    const position = XLSX.utils.decode_cell(header[0]);
    const col = position.c - 1;
    const cell = (row, column) => sheet[XLSX.utils.encode_cell({ r: row - 1, c: column })]?.v;
    const items = [];
    const ignored = [];
    let totalRow;
    for (let row = position.r + 2; row <= XLSX.utils.decode_range(sheet["!ref"]).e.r + 1; row++) {
      const description = clean(cell(row, col + 1));
      if (/^TOTAL EXPENSES$/i.test(description)) { totalRow = row; break; }
      const amount = readAmount(cell(row, col + 5));
      if (amount == null) continue;
      if (!description && !clean(cell(row, col + 4))) { ignored.push(row); continue; }
      const prior = items.at(-1);
      const title = description || prior?.description || `Invoice ${clean(cell(row, col + 4))}`;
      const rawDate = cell(row, col);
      const sourceCells = XLSX.utils.encode_range({ s: { r: row - 1, c: col }, e: { r: row - 1, c: col + 11 } });
      const inputVat = typeof cell(row, col + 10) === "number" ? readAmount(cell(row, col + 10)) : null;
      const base = typeof cell(row, col + 9) === "number" ? readAmount(cell(row, col + 9)) : null;
      const verifiedVat = inputVat != null && base != null && Math.abs(base + inputVat - amount) <= 0.01;
      const rowSource = { ...source, sheet: name, cells: sourceCells };
      items.push({ id: stableId(`${source.sha256}:${name}:${row}`), date: expenseDate(rawDate), description: title,
        category: category(cell(row, col + 2), title), supplier: clean(cell(row, col + 3)) || (!description ? prior?.supplier ?? "" : ""),
        invoice_number: clean(cell(row, col + 4)), invoice_name: typeof cell(row, col + 8) === "string" ? clean(cell(row, col + 8)) : "",
        amount, refunded_amount: 0,
        vat_mode: verifiedVat ? "inclusive" : "off", vat_rate: verifiedVat ? 12 : 0,
        method: clean(cell(row, col + 6)), notes: `Source: ${source.workbook}, ${name}!${sourceCells}.` + (rawDate && !expenseDate(rawDate) ? ` Original date: ${clean(rawDate)}.` : ""),
        workbook_source: rowSource, source_row: row,
      });
    }
    if (!totalRow) throw new Error(`Missing expense total in ${name}.`);
    for (const item of items) {
      const refund = readAmount(cell(item.source_row, col + 7)) ?? 0;
      if (refund <= item.amount) item.refunded_amount = refund;
      else item.notes += ` The source refund ${refund} is a grouped total, not assigned to this single item.`;
    }
    const rows = items.map((item) => item.source_row);
    const total = items.reduce((sum, item) => sum + Math.round(item.amount * 100), 0) / 100;
    return { title: name.trim(), rawSheet: name, items, ignored, total, displayedTotal: readAmount(cell(totalRow, col + 5)), totalCell: XLSX.utils.encode_cell({ r: totalRow - 1, c: col + 5 }),
      details: { name: clean(cell(5, col)).replace(/^Project Name:\s*/i, ""), client: clean(cell(6, col)).replace(/^Client:\s*/i, ""), location: clean(cell(7, col)).replace(/^Proo?ject Location:\s*/i, "") }, rows };
  });
  return { source, sheets };
}

module.exports = { readMonitoringWorkbook, readAmount, expenseDate };
