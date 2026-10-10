import type { HistoricalIncomeRecord, RentalIncomeImport } from "../incomeTypes";

type Cell = { v: string | number; f?: string };
type Snapshot = Record<string, Record<string, Cell>>;
const groups = [5,9,13,15,17,19,23,25,27,29,31,35,37,41,45,49,52,54,56,58,62,66,70,72,75,77,79,81,83,88,90,94,95,96,98,99,100,101,102,103,104];
const ends: Record<number, number> = {49:50,72:73,90:91,96:97};
const months: Record<string, string> = {jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12"};

export function parseIncomeDate(value: unknown): string | null {
  const match = String(value ?? "").trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (!match || !months[match[1].toLowerCase().slice(0,3)]) return null;
  const date = `${match[3]}-${months[match[1].toLowerCase().slice(0,3)]}-${match[2].padStart(2,"0")}`;
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === date ? date : null;
}

/** Reviewed layout of Gmea Customer (1).xlsx. Never forward-fill across job boundaries. */
export function parseCustomerIncomeWorkbook(snapshot: Snapshot, sourceHash: string, sourceName: string): RentalIncomeImport {
  const cells = snapshot["CUSTOMER TRANSACTION"];
  if (!cells || String(cells.E2?.v).replace(/\s+/g," ").trim() !== "PAY DATE" || cells.F2?.v !== "COMPANY NAME"
    || cells.H93?.v !== "50%DOWN PAYMENT" || cells.J93?.v !== "FULL PAYMENT") {
    throw new Error("Workbook layout changed. Review the parser before importing.");
  }
  const value = (col: string, row: number) => cells[`${col}${row}`]?.v;
  const text = (col: string, row: number) => String(value(col,row) ?? "").trim();
  const amount = (col: string, row: number) => typeof value(col,row) === "number" ? Number(value(col,row)) : null;
  const records: HistoricalIncomeRecord[] = groups.map((start,index) => {
    const end = ends[start] ?? ((groups[index+1] ?? 105)-1);
    const id = `customer-income-v1-row-${start}`;
    const sourceRows = [];
    for (let row=start; row<=end; row++) {
      const fields: Record<string,string|number> = {row};
      for (const col of ["E","F","G","H","I","J","K","L"]) if (value(col,row) !== undefined) fields[col] = value(col,row)!;
      sourceRows.push(fields);
    }
    const client = text("F",start);
    if (!client) throw new Error(`Missing source client at F${start}.`);
    const location = [...new Set(sourceRows.map(row => String(row.G ?? "").trim()).filter(Boolean))].join(" / ");
    const method = text("L",start);
    const issues: string[] = [];
    const billSubmitted = text("E",start) === "Bill SUB";
    const conflicting = [88,90,94,96,98,99].includes(start);
    if (billSubmitted) issues.push("Bill submission: receipt has not been confirmed.");
    if (conflicting) issues.push("Payment columns, total or dates conflict. Confirm amounts and individual payment dates.");
    if (!location) issues.push("Location is not recorded.");
    if (client === "s" || client === "Bayanga") issues.push("Confirm the company / client name recorded in the source.");
    const receipts: HistoricalIncomeRecord["receipts"] = [];
    if (start < 93) {
      let type: "down_payment" | "full_payment" | "unclassified" = "unclassified";
      for (let row=start; row<=end; row++) {
        const label = text("E",row).toLowerCase();
        if (label === "downpayment") type = "down_payment";
        if (label === "fullypaid") type = "full_payment";
        const sum = amount("H",row);
        if (sum !== null) {
          const date = parseIncomeDate(value("E",row)) ?? parseIncomeDate(value("E",row+1));
          receipts.push({id:`${id}-H${row}`,amount:sum,date,type,method,source:`H${row}`,confirmed:!!date && !billSubmitted && !conflicting});
          if (!date) issues.push(`Payment date missing or unclear for H${row}.`);
        }
      }
      // The split-company section records amounts in J; these remain on hold.
      if (start === 90 && amount("J",90) !== null) receipts.push({id:`${id}-J90`,amount:amount("J",90)!,date:parseIncomeDate(value("E",91)),
        type:"full_payment",method,source:"J90",confirmed:false});
    } else {
      for (let row=start; row<=end; row++) for (const col of ["H","J"]) {
        const sum = amount(col,row);
        if (sum === null) continue;
        const date = parseIncomeDate(value(col === "J" && amount("H",row) !== null ? "I" : "E",row));
        receipts.push({id:`${id}-${col}${row}`,amount:sum,date,type:col === "H" ? "down_payment" : "full_payment",
          method,source:`${col}${row}`,confirmed:!!date && !conflicting});
        if (!date) issues.push(`Payment date missing or unclear for ${col}${row}.`);
      }
    }
    let charge = start < 51 || [62,66,79].includes(start) ? amount(start === 66 ? "K" : "J",start)
      : start >= 93 ? amount("K",start) : null;
    if (billSubmitted || conflicting || start === 100) charge = null;
    if (charge !== null && receipts.reduce((total, receipt) => total + receipt.amount, 0) > charge) {
      issues.push("Receipt amounts exceed the stated total charge. Confirm the charge; dated receipts are preserved.");
      charge = null;
    }
    if (charge === null) issues.push("Total rental charge is unconfirmed; excluded from outstanding balances.");
    const service = client.toLowerCase() === "mr depot" ? (start === 62 ? "Fabrication" : "Truck Delivery")
      : [5,9,13,15,17,19,23,25,29,35,88,94,95,96,98,99,100,101,102,103,104].includes(start) ? "Backhoe" : "";
    return {id,client,location,service,source:`CUSTOMER TRANSACTION rows ${start}–${end}`,charge,
      issues:[...new Set(issues)],receipts,sourceRows};
  });
  const covered = new Set(records.flatMap(record => record.sourceRows.map(row => Number(row.row))));
  for (const [address,cell] of Object.entries(cells)) {
    const match = address.match(/^([HJ])(\d+)$/);
    if (match && Number(match[2]) >= 5 && typeof cell.v === "number" && !covered.has(Number(match[2]))) {
      throw new Error(`Unmapped payment amount at ${address}. Review before importing.`);
    }
  }
  const coveredReceipts = new Set(records.flatMap(record => record.receipts.map(receipt => receipt.source)));
  for (const [address,cell] of Object.entries(cells)) {
    const match = address.match(/^H(\d+)$/);
    if (match && Number(match[1]) >= 5 && typeof cell.v === "number" && !coveredReceipts.has(address)) throw new Error(`Unmapped receipt at ${address}.`);
  }
  return {source_name:sourceName,source_hash:sourceHash,parser_version:1,records,source_snapshot:snapshot};
}
