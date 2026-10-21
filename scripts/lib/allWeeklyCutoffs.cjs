const X = require('xlsx');
const { clean, mergedValue, parseDate } = require('./allWeeklySourceValues.cjs');
const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const monthNumber = value => months.findIndex(month => month.startsWith(value.toUpperCase())) + 1;
function weeklySheetMonths(workbook) {
  let year;
  const result = {};
  for (const name of workbook.SheetNames) {
    const heading = name.trim().toUpperCase(), foundYear = heading.match(/20\d{2}/)?.[0];
    if (foundYear) year = foundYear;
    const month = months.findIndex(word => heading.startsWith(word) || heading.startsWith(word.slice(0, 3)));
    if (/WEEK/i.test(name) && year && month >= 0) result[name] = `${year}-${String(month + 1).padStart(2, '0')}`;
  }
  return result;
}
function parseCutoffLabel(label, month) {
  const text = clean(label).replace(/(?:,?\s*)(20\d{1,2})\s*$/, '').trim();
  const match = text.match(/^([A-Za-z]+)\s*(\d{1,2})\s*[-,]?\s*(?:([A-Za-z]+)\s*)?(\d{1,2})$/);
  if (!match || !month) return null;
  const startMonth = monthNumber(match[1]), endMonth = monthNumber(match[3] || match[1]);
  if (!startMonth || !endMonth) return null;
  let startYear = +month.slice(0, 4);
  if (startMonth > +month.slice(5, 7) && startMonth === 12 && +month.slice(5, 7) === 1) startYear--;
  const start = parseDate(`${months[startMonth - 1]} ${match[2]},${startYear}`);
  const end = parseDate(`${months[endMonth - 1]} ${match[4]},${startYear + (endMonth < startMonth ? 1 : 0)}`);
  return start && end && start <= end ? { month, start, end, label: clean(label) } : null;
}
function readWeeklyCutoff(sheet, header, last, month) {
  for (let row = header.r; row < last; row++) {
    const value = mergedValue(sheet, row, header.c - 1);
    const result = parseCutoffLabel(value, month);
    if (result) return { ...result, block: X.utils.encode_cell(header) };
  }
  return null;
}
module.exports = { weeklySheetMonths, parseCutoffLabel, readWeeklyCutoff };
