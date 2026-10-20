const X = require('xlsx');
const clean = value => String(value ?? '').replace(/"/g, '').replace(/\s+/g, ' ').trim();
const normalize = value => clean(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const isoDate = (year, month, day) => {
  const value = new Date(Date.UTC(year, month - 1, day));
  return value.getUTCFullYear() === year && value.getUTCMonth() + 1 === month && value.getUTCDate() === day ? value.toISOString().slice(0, 10) : null;
};
function parseDate(value) {
  if (value instanceof Date) return isoDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  if (typeof value === 'number') { const d = X.SSF.parse_date_code(value); return d && isoDate(d.y, d.m, d.d); }
  const text = clean(value).replace(/^M ay/i, 'May');
  const match = text.match(/^([A-Za-z]+)\s*(\d{1,2})\s*[, ]\s*(20\d{2})$/);
  if (!match) return null;
  const month = monthNames.findIndex(name => name.startsWith(match[1].toUpperCase()));
  return month < 0 ? null : isoDate(+match[3], month + 1, +match[2]);
}
function mergedValue(sheet, row, col) {
  const value = sheet[X.utils.encode_cell({ r: row, c: col })]?.v;
  if (value !== undefined && value !== '') return value;
  const merge = (sheet['!merges'] || []).find(m => row >= m.s.r && row <= m.e.r && col >= m.s.c && col <= m.e.c);
  return merge ? sheet[X.utils.encode_cell(merge.s)]?.v : undefined;
}
const equipmentAliases = {
  YELLOW: 'Yellow Dump Truck', YELLOWDUMP: 'Yellow Dump Truck', YELLOWDUMPTRUCK: 'Yellow Dump Truck',
  RED: 'Red Mini Dump Truck', REDMINIDUMP: 'Red Mini Dump Truck', REDMINIDUMPTRUCK: 'Red Mini Dump Truck',
  REEMINIDUMP: 'Red Mini Dump Truck', WHITEDUMP: 'White Mini Dump Truck', WHITEMINIDUMP: 'White Mini Dump Truck',
  WHITEMINNIDUMP: 'White Mini Dump Truck', WHITEMINIDUMPTRUCK: 'White Mini Dump Truck', WHITEMINIDUMPT: 'White Mini Dump Truck',
  MIXER: 'Concrete Mixer',
  BONGO: 'Bongo', BONGGO: 'Bongo', CANTER: 'Canter', FORWARD: 'Forward',
  BACKHOEXCMG: 'Backhoe XCMG', BACKHOEVOLVO: 'Backhoe Volvo',
};
function equipmentName(value) { return equipmentAliases[normalize(value)] || null; }
function categoryName(description, section, party) {
  if (section === 'cash-advance') return 'Cash Advance';
  if (section === 'salary') return /DRIVER/i.test(party) ? 'Driver' : /OPERATOR/i.test(party) ? 'Operator' : 'Labor';
  const text = normalize(description);
  if (/DIESEL/.test(text) && !/ALLOW|ALLO|OTHER|FOOD/.test(text)) return 'Diesel/Fuel';
  if (/^GAS/.test(text)) return 'Gasoline';
  if (/^(MAINTENANCE|MAINTENACE|MAINTENCE|MAINT|ATF)$/.test(text)) return 'Maintenance';
  if (/RENEW|REGISTRATION/.test(text)) return 'Registration/Renewal';
  if (/REPAIR/.test(text)) return 'Repair';
  return 'Miscellaneous';
}
module.exports = { clean, normalize, parseDate, mergedValue, equipmentName, categoryName };
