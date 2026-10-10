const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const XLSX = require("xlsx");

function sourceDate(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (!date) throw new Error("Invalid source date.");
    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }
  const parsed = new Date(String(value).trim());
  if (!Number.isFinite(parsed.valueOf())) throw new Error(`Invalid source date: ${value}`);
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

function stableId(seed) {
  const hex = crypto.createHash("sha256").update(seed).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = "8";
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].map((part) => part.join("")).join("-");
}

function readContractWorkbook(filename) {
  const bytes = fs.readFileSync(filename);
  const workbook = XLSX.read(bytes, { type: "buffer" });
  const sheet = workbook.Sheets["PROJECT CONTRACT"];
  if (!sheet) throw new Error("Missing PROJECT CONTRACT sheet.");
  const value = (cell) => sheet[cell]?.v;
  const amount = (cell) => {
    const v = value(cell);
    if (v == null || v === "") return 0;
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) throw new Error(`Invalid amount at ${cell}.`);
    return Math.round(v * 100) / 100;
  };
  const records = [];
  // The lower section repeats ongoing projects; import the master table once.
  for (let row = 5; row <= 15; row++) {
    if (typeof value(`A${row}`) !== "number") continue;
    let end = row;
    while (end < 15 && typeof value(`A${end + 1}`) !== "number") end++;
    const deposit = amount(`H${row}`);
    const terms = [{ amount: deposit, collected: deposit, date: sourceDate(value(`I${row}`)), cells: `H${row}:I${row}`, display_percentage: typeof value(`G${row}`) === "number" ? value(`G${row}`) * 100 : null }];
    for (let r = row; r <= end; r++) {
      const collected = amount(`L${r}`);
      const outstanding = amount(`K${r}`);
      if (collected + outstanding === 0) continue;
      terms.push({ amount: Math.round((collected + outstanding) * 100) / 100, collected, date: sourceDate(value(`M${r}`)), cells: `K${r}:M${r}`, display_percentage: typeof value(`J${r}`) === "number" ? value(`J${r}`) * 100 : null });
    }
    records.push({ row, title: String(value(`B${row}`)).trim(), contract: amount(`F${row}`), expenses: amount(`N${row}`), status: value(`P${row}`) === "Done" ? "completed" : "active", terms,
      details: { title: String(value(`B${row}`) ?? "").trim(), client: String(value(`C${row}`) ?? "").trim(), name: String(value(`D${row}`) ?? "").trim(), location: String(value(`E${row}`) ?? "").trim(), duration: String(value(`O${row}`) ?? "").trim() } });
  }
  const sum = (items) => items.reduce((total, item) => total + Math.round(item * 100), 0) / 100;
  if (records.length !== 9 || sum(records.map((record) => record.contract)) !== amount("F17")
    || sum(records.map((record) => record.expenses)) !== amount("N17")
    || sum(records.flatMap((record) => record.terms.map((term) => term.amount - term.collected))) !== amount("K17")) {
    throw new Error("The source master table does not reconcile to its summary.");
  }
  return { records, source: { workbook: path.basename(filename), sheet: "PROJECT CONTRACT", sha256: crypto.createHash("sha256").update(bytes).digest("hex"), imported_at: new Date().toISOString() } };
}

module.exports = { readContractWorkbook, stableId, sourceDate };
