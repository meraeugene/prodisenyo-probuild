// Read-only source verification, run against the user's original workbook.
const assert=require('node:assert/strict');
const {readRentalWeeklyWorkbook}=require('./lib/rentalWeeklyWorkbook.cjs');
const report=readRentalWeeklyWorkbook(process.argv[2]);
assert.equal(report.weeks.length,9);assert.equal(report.weeks.flatMap(week=>week.rows).length,92);
assert.deepEqual(report.weeks.map(week=>week.total),[22408.92,34316.07,23792.57,32782.69,40714.38,31840.57,46019.51,10000,14860]);
assert.deepEqual(report.weeks.filter(week=>week.difference).map(week=>week.difference),[4000,3500]);
assert.equal(report.weeks[4].rows.filter(row=>row.date==='2026-09-01').length,3);
assert.equal(report.weeks[8].rows.filter(row=>row.date==='2026-10-02').length,2);
assert.deepEqual(report.weeks[7].pending,['cash-advance','salary']);
assert.ok(report.weeks.every(week=>['AUGUST WEEKLY','SEPTEMBER WEEKLY'].includes(week.sourceSheet)));
console.log('Verified 92 dated itemized expenses across 9 original weekly cutoffs; copied October template excluded.');
