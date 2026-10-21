const fs = require('node:fs'), crypto = require('node:crypto'), X = require('xlsx');
const { clean, normalize, parseDate, mergedValue, equipmentName, categoryName } = require('./allWeeklySourceValues.cjs');
const { weeklySheetMonths, readWeeklyCutoff } = require('./allWeeklyCutoffs.cjs');
const cents = value => Math.round(Number(value) * 100);
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
function sourceId(text) {
  const hex = sha(text);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
function parseAllWeeklyWorkbook(workbook, source) {
  const records = [], controls = [], sheets = [], emptyRows = [], cutoffs = [];
  const sheetMonths = weeklySheetMonths(workbook);
  for (const name of workbook.SheetNames.filter(name => /WEEK/i.test(name))) {
    const sheet = workbook.Sheets[name], headers = [];
    if (!sheet['!ref']) { sheets.push({ name, blocks: 0, records: 0 }); continue; }
    for (const [cell, value] of Object.entries(sheet)) {
      if (!cell.startsWith('!') && /EXPENSES DUMP TRUCK/i.test(clean(value.v))) headers.push(X.utils.decode_cell(cell));
    }
    headers.sort((a, b) => a.r - b.r || a.c - b.c);
    const countBefore = records.length;
    for (const header of headers) {
      const last = headers.find(next => next.c === header.c && next.r > header.r)?.r ?? X.utils.decode_range(sheet['!ref']).e.r + 1;
      const col = header.c;
      const cutoff = readWeeklyCutoff(sheet, header, last, sheetMonths[name]);
      cutoffs.push({ sheet: name, block: X.utils.encode_cell(header), month: sheetMonths[name], cutoff });
      let section = 'equipment', rawDate, groupDate, party = '', thirteenth = false, partialBonus = false;
      let seenParties = new Set();
      for (let row = header.r + 1; row < last; row++) {
        const label = clean(mergedValue(sheet, row, col));
        const value = mergedValue(sheet, row, col + 1), marker = normalize(value);
        if (/^TOTAL EXPENSES/i.test(label) || /^TOTAL EXPENSES/i.test(clean(value))) {
          controls.push({ sheet: name, cell: X.utils.encode_cell({ r: row, c: col + 3 }), amount: sheet[X.utils.encode_cell({ r: row, c: col + 3 })]?.v }); break;
        }
        if (/^TOTAL\b/i.test(label)) {
          controls.push({ sheet: name, cell: X.utils.encode_cell({ r: row, c: col + 1 }), amount: value, reason: 'section subtotal' }); continue;
        }
        if (/^(CA|CASHADVANCE|SALARY|PARTIAL13TH)$/.test(marker)) {
          section = /CA|CASHADVANCE/.test(marker) ? 'cash-advance' : 'salary';
          rawDate = mergedValue(sheet, row, col); groupDate = parseDate(rawDate);
          partialBonus = marker === 'PARTIAL13TH';
          thirteenth = !partialBonus && /^13TH/i.test(clean(mergedValue(sheet, row, col + 2)));
          seenParties = new Set();
          continue;
        }
        if (section === 'equipment' && normalize(label) === 'DATE') continue;
        const amountCol = section === 'equipment' ? col + 3 : col + 1;
        const amountCell = X.utils.encode_cell({ r: row, c: amountCol });
        const amount = sheet[amountCell]?.v;
        if (section === 'equipment') {
          const dateValue = mergedValue(sheet, row, col);
          if (dateValue != null && clean(dateValue)) rawDate = dateValue;
          if (typeof value === 'string' && value.trim()) party = clean(value);
        } else party = label;
        const add = (rawAmount, cell, bonus = false) => {
          if (rawAmount == null || rawAmount === '' || rawAmount === 0) return;
          if (typeof rawAmount !== 'number' || !Number.isFinite(rawAmount) || rawAmount < 0) throw new Error(`Invalid weekly amount: ${name}!${cell}`);
          const date = section === 'equipment' ? parseDate(rawDate) : groupDate;
          const description = section === 'equipment' ? clean(mergedValue(sheet, row, col + 2)) : `${bonus || partialBonus ? '13th Month' : section === 'salary' ? 'Salary' : 'Cash Advance'} - ${party}`;
          const equipment = section === 'equipment' ? equipmentName(party) : null;
          const issues = [];
          if (!date) issues.push(`Invalid or missing date: ${clean(rawDate)}`);
          if (!party) issues.push('Missing equipment/payee');
          if (section === 'equipment' && !equipment) issues.push(`Unknown equipment: ${party}`);
          if (!description) issues.push('Missing description');
          if (section !== 'equipment' && seenParties.has(normalize(party))) issues.push('Repeated payee without a new section/date heading');
          const sourceLocator = `${name}!${cell}:weekly-${bonus ? '13th-month' : section}`;
          const payload = { sheet: name, address: cell, block: X.utils.encode_cell(header), date, rawDate: clean(rawDate), amount: cents(rawAmount) / 100, section, party,
            equipment, category: categoryName(description, section, party), rawDescription: description, payee: section === 'equipment' ? '' : party, sourceLocator };
          const sourceFingerprint = sha(JSON.stringify(payload));
          records.push({ ...payload, id: sourceId(`all-weekly:${source.sha256}:${sourceLocator}`), sourceFingerprint, issues,
            cutoff, kind: bonus || partialBonus ? '13th-month' : section, order: row * 100 + amountCol });
        };
        if (amount != null && amount !== '' && !party) emptyRows.push({ sheet: name, cell: amountCell });
        add(amount, amountCell);
        if (section === 'salary' && thirteenth) {
          const bonusCell = X.utils.encode_cell({ r: row, c: col + 2 });
          add(sheet[bonusCell]?.v, bonusCell, true);
        }
        if (section !== 'equipment' && typeof amount === 'number' && amount > 0) seenParties.add(normalize(party));
      }
    }
    sheets.push({ name, blocks: headers.length, records: records.length - countBefore });
  }
  return { source, sheets, records, controls, emptyRows, cutoffs };
}
function readAllWeeklyWorkbook(file) {
  const bytes = fs.readFileSync(file);
  return parseAllWeeklyWorkbook(X.read(bytes, { type: 'buffer', cellDates: true, cellFormula: true }), { path: file, sha256: sha(bytes) });
}
module.exports = { readAllWeeklyWorkbook, parseAllWeeklyWorkbook, sourceId };
