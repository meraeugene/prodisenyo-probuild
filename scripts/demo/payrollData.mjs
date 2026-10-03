export function buildPayrollData(c) {
  const tables = {};
  const add = (table, key, row) => (tables[table] ??= []).push({ id: c.id(key), ...row });
  const names = ["Demo Juan Santos", "Demo Maria Reyes", "Demo Carlo Cruz", "Demo Ana Ramos", "Demo Luis Garcia", "Demo Rosa Lim"];
  const siteNames = ["Demo Riverside Residence", "Demo Uptown Office", "Demo Warehouse Renovation"];
  siteNames.forEach((name, s) => add("sites", `site:${s}`, { code: `DEMO-S${s + 1}`, name }));
  names.forEach((name, e) => {
    const s = e % 3;
    const role = e % 2 ? "DEMO-SKILLED" : "DEMO-LABOR";
    add("employees", `employee:${e}`, { employee_code: `DEMO-E${e + 1}`, full_name: name, default_role_code: role, site_id: c.id(`site:${s}`) });
    add("employee_biometric_aliases", `alias:${e}`, { employee_id: c.id(`employee:${e}`), raw_alias: name, normalized_alias: name.toLowerCase(), match_source: "MANUAL", confirmed: true, confirmed_by: c.user("payroll_manager"), confirmed_at: c.stamp() });
    add("employee_branch_rates", `branch-rate:${e}`, { employee_name: name, employee_name_key: name.toLowerCase(), role_code: role, site_name: siteNames[s], site_name_key: siteNames[s].toLowerCase(), daily_rate: e % 2 ? 800 : 600, regular_paid_hours: 8, overtime_multiplier: 1.25, updated_by: c.user("payroll_manager") });
    for (let day = 0; day < 7; day++) add("employee_work_schedules", `schedule:${e}:${day}`, { employee_id: c.id(`employee:${e}`), site_id: c.id(`site:${s}`), day_of_week: day, is_workday: day !== 0, created_by: c.user("payroll_manager") });
  });
  ["DEMO-LABOR", "DEMO-SKILLED"].forEach((role, i) => add("role_rates", `role-rate:${i}`, { role_code: role, daily_rate: i ? 800 : 600, updated_by: c.user("payroll_manager") }));
  // Six months of approved history plus draft/submitted/rejected current runs.
  for (let r = 0; r < 9; r++) {
    const s = r % 3;
    const offset = r < 6 ? -150 + r * 28 : -7;
    const status = r < 6 ? "approved" : ["draft", "submitted", "rejected"][r - 6];
    const start = c.date(offset), end = c.date(offset + 5);
    const period = `${start} to ${end}`;
    const people = names.map((name, e) => ({ name, e })).filter(({ e }) => e % 3 === s);
    const gross = people.reduce((sum, { e }) => sum + (e % 2 ? 800 : 600) * 6, 0);
    add("attendance_imports", `import:${r}`, { original_filename: `demo-attendance-${r + 1}.xlsx`, site_id: c.id(`site:${s}`), site_name: siteNames[s], period_label: period, period_start: start, period_end: end, uploaded_by: c.user("payroll_manager"), raw_rows: people.length * 24, removed_entries: 0, created_at: c.stamp(offset + 6) });
    add("payroll_runs", `run:${r}`, { attendance_import_id: c.id(`import:${r}`), site_id: c.id(`site:${s}`), site_name: siteNames[s], period_label: period, period_start: start, period_end: end, status, created_by: c.user("payroll_manager"), submitted_by: status === "draft" ? null : c.user("payroll_manager"), submitted_at: status === "draft" ? null : c.stamp(offset + 6), approved_by: status === "approved" ? c.user("ceo") : null, approved_at: status === "approved" ? c.stamp(offset + 7) : null, rejected_at: status === "rejected" ? c.stamp() : null, rejection_reason: status === "rejected" ? "Demo: please verify attendance." : null, gross_total: gross, net_total: gross, created_at: c.stamp(offset + 6) });
    people.forEach(({ name, e }) => {
      const rate = e % 2 ? 800 : 600, role = e % 2 ? "DEMO-SKILLED" : "DEMO-LABOR";
      add("payroll_run_items", `run-item:${r}:${e}`, { payroll_run_id: c.id(`run:${r}`), employee_id: c.id(`employee:${e}`), employee_name: name, role_code: role, site_name: siteNames[s], days_worked: 6, hours_worked: 48, rate_per_day: rate, regular_pay: rate * 6, total_pay: rate * 6 });
      for (let d = 0; d < 6; d++) {
        const day = c.date(offset + d);
        [["08:00", "IN", "Time1"], ["12:00", "OUT", "Time1"], ["13:00", "IN", "Time2"], ["17:00", "OUT", "Time2"]].forEach(([time, type, source], l) => add("attendance_records", `log:${r}:${e}:${d}:${l}`, { import_id: c.id(`import:${r}`), employee_id: c.id(`employee:${e}`), employee_name: name, raw_biometric_name: name, normalized_biometric_name: name.toLowerCase(), match_status: "MATCHED", match_source: "EXISTING_ALIAS", log_date: day, log_time: time, log_type: type, log_source: source, site_name: siteNames[s] }));
        add("payroll_run_daily_totals", `daily:${r}:${e}:${d}`, { payroll_run_id: c.id(`run:${r}`), payroll_run_item_id: c.id(`run-item:${r}:${e}`), attendance_import_id: c.id(`import:${r}`), employee_name: name, role_code: role, site_name: siteNames[s], payout_date: day, hours_worked: 8, total_pay: rate });
        add("payroll_attendance_days", `attendance-day:${r}:${e}:${d}`, { payroll_run_id: c.id(`run:${r}`), payroll_run_item_id: c.id(`run-item:${r}:${e}`), attendance_import_id: c.id(`import:${r}`), employee_id: c.id(`employee:${e}`), employee_name: name, employee_name_key: name.toLowerCase(), role_code: role, site_name: siteNames[s], attendance_date: day, schedule_type: "workday", biometric_time_in: "08:00", biometric_time_out: "17:00", biometric_worked_seconds: 32400, break_seconds: 3600, calculated_regular_seconds: 28800, classification: "WORKED", approved_regular_seconds: 28800, source: "biometric" });
      }
    });
  }
  ["employee", "engineer", "payroll_manager"].forEach((role, i) => ["pending", "approved", "rejected"].forEach((status, j) => {
    add("overtime_requests", `ot:${i}:${j}`, { requester_role: role, requested_by: c.user(role), employee_name: names[0], role_code: "DEMO-LABOR", site_name: siteNames[0], request_date: c.date(-j - 1), overtime_hours: 2, amount: 187.5, reason: "Demo: concrete pouring and site cleanup", status, approved_by: status === "approved" ? c.user("ceo") : null, approved_at: status === "approved" ? c.stamp() : null, rejected_at: status === "rejected" ? c.stamp() : null, rejection_reason: status === "rejected" ? "Demo: work moved to next shift." : null });
  }));
  ["pending", "approved", "rejected"].forEach((status, i) => add("payroll_adjustments", `adjustment:${i}`, { payroll_run_id: c.id("run:6"), attendance_import_id: c.id("import:6"), employee_name: names[0], employee_name_key: names[0].toLowerCase(), site_name: siteNames[0], site_name_key: siteNames[0].toLowerCase(), role_code: "DEMO-LABOR", adjustment_type: "cash_advance", requested_by: c.user("payroll_manager"), status, amount: 500, quantity: 1, effective_date: c.date(-2), notes: "Demo cash advance" }));
  add("employee_leave_records", "leave:0", { employee_id: c.id("employee:0"), leave_date: c.date(2), leave_type: "paid", status: "approved", payable_seconds: 28800, reason: "Demo personal leave", requested_by: c.user("employee"), approved_by: c.user("ceo"), approved_at: c.stamp() });
  add("payroll_holidays", "holiday:0", { holiday_date: c.date(7), name: "Demo company day", holiday_type: "company", site_id: c.id("site:0"), created_by: c.user("payroll_manager") });
  return tables;
}
