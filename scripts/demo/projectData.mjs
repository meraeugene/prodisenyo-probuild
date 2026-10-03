import { DEMO_FILES } from "./storage.mjs";

export function buildProjectData(c) {
  const tables = {};
  const add = (table, key, row) => (tables[table] ??= []).push({ id: c.id(key), ...row });
  const names = ["Demo Riverside Residence", "Demo Uptown Office", "Demo Warehouse Renovation", "Demo Hillside Extension"];
  const materials = [["Portland cement", "bag", 280, 200], ["Reinforcing steel", "piece", 420, 100], ["Concrete blocks", "piece", 25, 1000]];
  materials.forEach(([name, unit, cost], i) => add("cost_catalog_items", `catalog:${i}`, { name: `Demo ${name}`, category: "materials", unit_label: unit, unit_cost: cost, created_by: c.user("engineer") }));
  names.forEach((name, p) => {
    const status = ["active", "on_hold", "completed", "planning"][p];
    add("projects", `project:${p}`, { name, location: ["Cagayan de Oro", "Bukidnon", "Iligan", "Cagayan de Oro"][p], client_name: `Demo Client ${p + 1}`, assigned_engineer_id: c.user("engineer"), assigned_estimate_engineer_id: c.user("engineer"), status, budget_ceiling: 1500000 + p * 500000, start_date: c.date(-90), end_date: c.date(p === 2 ? -5 : 60), description: "Demo construction project for UI previews", created_by: c.user("ceo") });
    // Also include this deferred FK in schema preflight before any writes.
    tables.projects.at(-1).active_approved_estimate_id = null;
    add("budget_projects", `budget:${p}`, { project_id: c.id(`project:${p}`), name, project_type: p === 2 ? "renovation" : "new_build", starting_budget: 1500000 + p * 500000, created_by: c.user("ceo") });
    const estimateStatus = ["approved", "submitted", "rejected", "draft"][p];
    add("project_estimates", `estimate:${p}`, { project_id: c.id(`project:${p}`), project_name: name, project_type: "new_build", client_name: `Demo Client ${p + 1}`, location: "Cagayan de Oro", estimate_total: 123000, status: estimateStatus, requested_by: c.user("engineer"), budget_project_id: c.id(`budget:${p}`), submitted_at: p === 3 ? null : c.stamp(-10), approved_by: p === 0 ? c.user("ceo") : null, approved_at: p === 0 ? c.stamp(-9) : null, rejected_at: p === 2 ? c.stamp(-8) : null, rejection_reason: p === 2 ? "Demo: revise material quantities." : null });
    materials.forEach(([name, unit, cost, quantity], i) => {
      add("project_estimate_items", `estimate-item:${p}:${i}`, { estimate_id: c.id(`estimate:${p}`), catalog_item_id: c.id(`catalog:${i}`), boq_section: "Structural Works", boq_item_number: `1.${i + 1}`, item_name_snapshot: name, material_name_snapshot: name, category_snapshot: "materials", unit_label_snapshot: unit, unit_cost_snapshot: cost, quantity, line_total: cost * quantity, sort_order: i });
      add("budget_items", `budget-item:${p}:${i}`, { project_id: c.id(`budget:${p}`), name, category: "materials", status: ["completed", "ongoing", "upcoming"][i], estimated_cost: cost * quantity, actual_spent: i === 2 ? 0 : cost * quantity * (i === 0 ? 1 : 0.4), source_estimate_item_id: c.id(`estimate-item:${p}:${i}`), created_by: c.user("ceo"), sort_order: i });
    });
    ["Site preparation", "Foundation", "Structural works", "Finishing"].forEach((activity, i) => add("project_progress_activities", `activity:${p}:${i}`, { project_id: c.id(`project:${p}`), activity, weight_percent: 25, progress_percent: p === 2 ? 100 : p === 3 ? 0 : Math.max(0, 100 - i * 30), sort_order: i, created_by: c.user("ceo") }));
    if (p !== 3) {
      add("project_documents", `document:${p}`, { project_id: c.id(`project:${p}`), uploaded_by: c.user("engineer"), file_name: "Demo site report.pdf", storage_path: DEMO_FILES[p].path, mime_type: "application/pdf", file_size: 1000, category: "reports" });
      add("project_progress_submissions", `progress-submit:${p}`, { project_id: c.id(`project:${p}`), submitted_by: c.user("engineer"), activity_count: 4 });
      add("project_progress_updates", `progress-update:${p}`, { project_id: c.id(`project:${p}`), submitted_by: c.user("engineer"), overall_percent: p === 2 ? 100 : 55, completed_work_summary: "Demo: foundation completed; structural work progressing.", remarks: "Demo site report", progress_date: c.date(-2) });
    }
    ["todo", "in_progress", "completed", "delayed"].forEach((taskStatus, i) => add("project_tasks", `task:${p}:${i}`, { project_id: c.id(`project:${p}`), assigned_to: c.user("engineer"), created_by: c.user("ceo"), title: ["Inspect foundation", "Coordinate deliveries", "Submit site report", "Review finishing schedule"][i], due_date: c.date(i - 2), priority: i === 3 ? "high" : "medium", status: taskStatus, progress: [0, 50, 100, 25][i] }));
    add("project_expenses", `project-expense:${p}`, { project_id: c.id(`project:${p}`), category: "transportation", description: "Demo site hauling", amount: 12000 + p * 3000, expense_date: c.date(-5), status: ["approved", "submitted", "rejected", "draft"][p], created_by: c.user("engineer"), submitted_at: p === 3 ? null : c.stamp(-4), reviewed_by: p === 0 ? c.user("ceo") : null, reviewed_at: p === 0 ? c.stamp(-3) : null });
  });
  ["submitted", "approved", "purchasing", "ordered", "received", "rejected"].forEach((status, i) => {
    const p = i % 2, material = materials[i % 3];
    add("material_requests", `material:${i}`, { project_id: c.id(`project:${p}`), estimate_item_id: c.id(`estimate-item:${p}:${i % 3}`), requested_by: c.user("engineer"), material_name: material[0], quantity: 20, unit: material[1], needed_by: c.date(3), site: names[p], priority: i === 0 ? "urgent" : "medium", status, notes: "Demo material request", approved_by: i > 0 && i < 5 ? c.user("ceo") : null, approved_at: i > 0 && i < 5 ? c.stamp(-3) : null, rejected_by: i === 5 ? c.user("ceo") : null, rejected_at: i === 5 ? c.stamp() : null, rejection_reason: i === 5 ? "Demo: excess stock on site." : null });
    if (i < 1 || i > 4) return;
    const orderStatus = ["", "submitted", "approved", "ordered", "received"][i];
    add("purchase_orders", `order:${i}`, { project_id: c.id(`project:${p}`), material_request_id: c.id(`material:${i}`), created_by: c.user("purchaser"), assigned_to: c.user("purchaser"), supplier_name: "Demo Northern Hardware", item_name: material[0], quantity: 20, unit: material[1], estimated_unit_cost: material[2], actual_unit_cost: material[2], status: orderStatus, delivery_status: i === 4 ? "delivered" : i === 3 ? "in_transit" : "pending", quotation_reference: `DEMO-Q${i}`, approved_by: i > 1 ? c.user("ceo") : null, approved_at: i > 1 ? c.stamp(-2) : null, ordered_at: i > 2 ? c.stamp(-1) : null, received_at: i === 4 ? c.stamp() : null });
    if (i === 4) {
      add("workflow_evidence", "evidence:4", { project_id: c.id(`project:${p}`), entity_type: "purchase_receipt", entity_id: c.id("order:4"), storage_path: DEMO_FILES[3].path, file_name: "Demo purchase receipt.pdf", content_type: "application/pdf", uploaded_by: c.user("purchaser") });
      add("delivery_verifications", "verification:4", { purchase_order_id: c.id("order:4"), project_id: c.id(`project:${p}`), verified_by: c.user("engineer"), received_quantity: 20, condition: "accepted", accepted: true, notes: "Demo complete delivery" });
      add("project_material_receipts", "material-receipt:4", { purchase_order_id: c.id("order:4"), project_id: c.id(`project:${p}`), item_name: material[0], quantity: 20, unit: material[1], total_cost: 20 * material[2], accepted_by: c.user("engineer") });
    }
  });
  add("project_closure_submissions", "closure:2", { project_id: c.id("project:2"), submitted_by: c.user("engineer"), final_notes: "Demo: all renovation work completed and ready for turnover.", progress_percent: 100, material_cost: 123000, other_expense_cost: 18000, payroll_cost: 72000, status: "submitted" });
  ["ceo", "engineer", "purchaser"].forEach((role) => add("workflow_notifications", `notification:${role}`, { recipient_id: c.user(role), project_id: c.id("project:0"), kind: "material_request", title: "Demo workflow update", message: "A demo material request is ready for review.", entity_type: "material_request", entity_id: c.id("material:0") }));
  add("audit_logs", "audit:0", { actor_id: c.user("ceo"), action: "demo_seed", entity_type: "project", entity_id: c.id("project:0"), payload: { demo: true } });
  return tables;
}
