export function buildGmeaData(c) {
  const tables = {};
  const add = (table, key, row) => (tables[table] ??= []).push({ id: c.id(key), ...row });
  for (let p = 0; p < 4; p++) {
    const contract = 500000 + p * 250000;
    add("gmea_projects", `gmea:${p}`, { title: `Demo GMEA ${p + 1}`, name: ["Demo Commercial Fitout", "Demo School Renovation", "Demo Residential Extension", "Demo Office Turnover"][p], color: ["#2563EB", "#16A34A", "#EA580C", "#9333EA"][p], client: `Demo GMEA Client ${p + 1}`, location: "Cagayan de Oro", contract_amount: contract, tax_rate: 0, duration: "90 Days", status: p === 3 ? "completed" : "active", completed_at: p === 3 ? c.stamp(-3) : null, completed_by: p === 3 ? c.user("gmea") : null, created_by: c.user("gmea"), updated_by: c.user("gmea"), created_at: c.stamp(-60 - p * 28) });
    [30, 40, 30].forEach((percentage, t) => {
      const amount = contract * percentage / 100;
      add("gmea_collections", `gmea-term:${p}:${t}`, { project_id: c.id(`gmea:${p}`), data: { description: ["Down payment", "Progress billing", "Final turnover"][t], value_mode: "percentage", percentage, amount, notes: "Demo contract payment term", sort_order: t } });
      if (t === 0 || p === 3) add("gmea_collection_receipts", `gmea-receipt:${p}:${t}`, { project_id: c.id(`gmea:${p}`), term_id: c.id(`gmea-term:${p}:${t}`), amount, received_date: c.date(-30 - p * 28), method: "Bank transfer", reference_number: `DEMO-G${p}-${t}`, recorded_by: c.user("gmea"), recorded_at: c.stamp(-30 - p * 28) });
    });
    ["materials", "labor", "transportation"].forEach((category, e) => {
      add("gmea_expenses", `gmea-expense:${p}:${e}`, { project_id: c.id(`gmea:${p}`), data: { date: c.date(-20 - p * 28 + e), description: `Demo ${category} expense`, category, supplier: "Demo Northern Hardware", invoice_number: `DEMO-INV${p}-${e}`, invoice_name: "Demo GMEA", amount: 30000 + e * 12000, refunded_amount: 0, vat_mode: "off", vat_rate: 0, method: "Bank transfer", notes: "", sort_order: e }, created_at: c.stamp(-20 - p * 28 + e) });
      add("gmea_expense_notifications", `gmea-notice:${p}:${e}`, { expense_id: c.id(`gmea-expense:${p}:${e}`), project_id: c.id(`gmea:${p}`), recipient_id: c.user("ceo"), read_at: e === 0 ? null : c.stamp() });
    });
    [60, 40].forEach((percentage, i) => add("gmea_partners", `partner:${p}:${i}`, { project_id: c.id(`gmea:${p}`), data: { name: ["Demo Prodisenyo", "Demo Partner"][i], percentage } }));
  }
  [["supplier", "Demo Northern Hardware"], ["method", "Demo bank transfer"], ["invoice_name", "Demo GMEA"]].forEach(([field, value], i) => add("gmea_expense_options", `gmea-option:${i}`, { field, value }));
  ["Excavator", "Dump Truck", "Concrete Mixer", "Generator"].forEach((name, i) => add("gmea_rental_equipment", `equipment:${i}`, { code: `DEMO-EQ${i + 1}`, name: `Demo ${name}`, equipment_type: name, default_rate: [5000, 4000, 1000, 1500][i], rate_unit: "day", status: ["on_rental", "available", "maintenance", "inactive"][i], is_active: i !== 3, created_by: c.user("gmea"), updated_by: c.user("gmea") }));
  add("gmea_rental_expense_categories", "rental-category:0", { name: "Demo operations", sort_order: 99 });
  ["Demo Pedro Operator", "Demo Mario Driver"].forEach((full_name, i) => add("gmea_rental_workers", `worker:${i}`, { worker_code: `DEMO-W${i + 1}`, full_name, role_name: i ? "Driver" : "Operator", default_rate: 850, created_by: c.user("gmea"), updated_by: c.user("gmea") }));
  ["active", "completed", "draft", "cancelled"].forEach((status, r) => {
    const start = -10 - r * 28;
    add("gmea_rentals", `rental:${r}`, { rental_number: `DEMO-R${r + 1}`, customer_name: `Demo Rental Customer ${r + 1}`, customer_contact: "09123456789", site_location: "Cagayan de Oro", start_date: c.date(start), expected_return_date: c.date(start + 20), actual_return_date: status === "completed" ? c.date(start + 15) : null, status, created_by: c.user("gmea"), updated_by: c.user("gmea"), created_at: c.stamp(start) });
    add("gmea_rental_items", `rental-item:${r}`, { rental_id: c.id(`rental:${r}`), equipment_id: c.id(`equipment:${r % 2}`), equipment_name: r % 2 ? "Demo Dump Truck" : "Demo Excavator", quantity: 1, rate: r % 2 ? 4000 : 5000, rate_unit: "day" });
    if (r > 1) return;
    add("gmea_rental_worker_assignments", `assignment:${r}`, { rental_id: c.id(`rental:${r}`), worker_id: c.id(`worker:${r}`), assigned_from: c.date(start), assigned_until: c.date(start + 15), rate: 850, status: r ? "completed" : "assigned" });
    add("gmea_rental_payments", `rental-payment:${r}`, { rental_id: c.id(`rental:${r}`), amount: r ? 60000 : 20000, payment_date: c.date(start + 5), method: "Bank transfer", reference_number: `DEMO-RPAY${r}`, recorded_by: c.user("gmea"), recorded_at: c.stamp(start + 5) });
    add("gmea_rental_expenses", `rental-expense:${r}`, { rental_id: c.id(`rental:${r}`), equipment_id: c.id(`equipment:${r}`), category_id: c.id("rental-category:0"), expense_date: c.date(start + 2), description: "Demo fuel and maintenance", supplier: "Demo Fuel Station", amount: 4500 + r * 1500, created_by: c.user("gmea"), updated_by: c.user("gmea"), created_at: c.stamp(start + 2) });
    add("gmea_rental_expense_notifications", `rental-notice:${r}`, { expense_id: c.id(`rental-expense:${r}`), rental_id: c.id(`rental:${r}`), recipient_id: c.user("ceo") });
  });
  return tables;
}
