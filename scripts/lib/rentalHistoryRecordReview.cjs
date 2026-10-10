const norm = value => String(value ?? "").trim().toUpperCase()
  .replace(/[^A-Z0-9&]+/g, " ").replace(/\s+/g, " ").trim();

function deduplicate(records) {
  const monthly = records.filter(record => record.kind === "monthly-equipment");
  const groups = new Map();
  for (const record of records.filter(record => record.kind !== "monthly-equipment")) {
    const key = [record.sourceMonth, record.date, record.kind, record.category,
      norm(record.payee || record.rawDescription)].join("|");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  const unique = [], duplicates = [], conflicts = [];
  for (const group of groups.values()) {
    if (new Set(group.map(record => record.amount)).size > 1) {
      for (const record of group) {
        record.issues.push("conflicting duplicate/revision in weekly sheet");
        conflicts.push(record);
      }
    } else {
      unique.push(group[0]);
      for (const record of group.slice(1)) {
        duplicates.push({ ...record, duplicateOf: group[0].sourceLocator });
      }
    }
  }
  return { records: [...monthly, ...unique, ...conflicts], duplicates, conflicts };
}

function flagCrossPeriodIssues(records) {
  const groups = new Map();
  for (const record of records) {
    if (record.dateCorrection) record.issues.push("date: inferred correction requires confirmation");
    if (!record.date || !record.sourceMonth) continue;
    const key = [record.date, record.amount, record.kind, record.equipment || norm(record.rawEquipment),
      record.category, norm(record.rawDescription)].join("|");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
    const distance = Math.abs(Date.parse(record.date) - Date.parse(record.sourceMonth.length === 7 ? `${record.sourceMonth}-01` : record.sourceMonth));
    if (record.date.slice(0, 4) !== record.sourceMonth.slice(0, 4) && distance > 40 * 86400000) {
      record.issues.push("date: transaction year differs from worksheet year");
    }
  }
  const duplicates = [...groups.values()].filter(group => new Set(group.map(record => record.sourceMonth)).size > 1);
  for (const group of duplicates) {
    for (const record of group) record.issues.push("possible duplicate across reporting months");
  }
  return duplicates;
}

module.exports = { deduplicate, flagCrossPeriodIssues };
