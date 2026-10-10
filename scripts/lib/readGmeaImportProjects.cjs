async function readAll(db, table) {
  const rows = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await db.from(table).select("*").order("id").range(from, from + 499);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}

async function readGmeaImportProjects(db) {
  const [projects, expenses, terms, receipts, partners] = await Promise.all([
    "gmea_projects", "gmea_expenses", "gmea_collections", "gmea_collection_receipts", "gmea_partners",
  ].map((table) => readAll(db, table)));
  return projects.map((project) => ({ ...project, contract_amount: Number(project.contract_amount), tax_rate: Number(project.tax_rate ?? 0),
    expenses: expenses.filter((row) => row.project_id === project.id).map((row) => ({ ...row.data, id: row.id })),
    payment_terms: terms.filter((row) => row.project_id === project.id).sort((a, b) => Number(a.data.sort_order ?? 0) - Number(b.data.sort_order ?? 0)).map((row) => ({ ...row.data, id: row.id,
      receipts: receipts.filter((receipt) => receipt.term_id === row.id).map((receipt) => ({ ...receipt, amount: Number(receipt.amount) })),
    })),
    partners: partners.filter((row) => row.project_id === project.id).map((row) => ({ ...row.data, id: row.id })),
  }));
}

module.exports = { readGmeaImportProjects };
