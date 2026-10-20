const crypto = require('node:crypto');
const { categoryName } = require('./allWeeklySourceValues.cjs');
function applyAllWeeklyResolutions(report, resolutions) {
  if (resolutions.workbookSha256 !== report.source.sha256) throw new Error('Resolutions belong to a different workbook.');
  for (const source of [...Object.keys(resolutions.rows || {}), ...Object.keys(resolutions.ignored || {})]) {
    if (!report.records.some(row => row.sourceLocator === source)) throw new Error(`Resolution source missing: ${source}`);
  }
  return { ...report, records: report.records.map(original => {
    const row = { ...original }, resolution = resolutions.rows?.[row.sourceLocator];
    if (resolutions.ignored?.[row.sourceLocator]) row.excludeReason = resolutions.ignored[row.sourceLocator];
    if (!resolution) return row;
    if (resolution.originalDate !== row.rawDate || !resolution.reason || !row.issues.length
      || row.issues.some(issue => !issue.startsWith('Invalid or missing date:') && issue !== 'Repeated payee without a new section/date heading')) {
      throw new Error(`Invalid resolution: ${row.sourceLocator}`);
    }
    row.date = resolution.date;
    if (resolution.section) {
      if (resolution.section !== 'salary') throw new Error('Only an explicitly reviewed salary heading may be supplied.');
      row.originalDescription = row.rawDescription;
      row.section = resolution.section;
      row.rawDescription = `Salary - ${row.party}`;
      row.category = categoryName(row.rawDescription, row.section, row.party);
    }
    row.issues = [];
    row.sourceFingerprint = crypto.createHash('sha256').update(JSON.stringify({ original: row.sourceFingerprint, resolution })).digest('hex');
    row.dateResolution = resolution;
    return row;
  }) };
}
function buildAllWeeklyUpdatePlans(updates) {
  return updates.map(({ row, expense, categoryId }) => ({ id: expense.id, version: expense.version, source: row.sourceLocator,
    command: { kind: 'update', value: {
      id: expense.id, rental_id: expense.rental_id, income_record_id: expense.income_record_id ?? null,
      equipment_id: expense.equipment_id, category_id: categoryId, date: row.date, amount: row.amount,
      description: row.rawDescription, supplier: expense.supplier, method: expense.method, invoice_number: expense.invoice_number,
      refunded_amount: Number(expense.refunded_amount), vat_mode: expense.vat_mode, vat_rate: Number(expense.vat_rate), version: expense.version,
      notes: `${expense.notes}\nWeekly reconciliation; source: ${row.sourceLocator}; source-fingerprint:${row.sourceFingerprint}; previous-amount:${expense.amount}; previous-description:${expense.description}`,
    } },
  }));
}
module.exports = { applyAllWeeklyResolutions, buildAllWeeklyUpdatePlans };
