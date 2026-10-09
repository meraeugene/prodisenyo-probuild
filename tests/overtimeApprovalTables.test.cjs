const assert = require("node:assert/strict");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const load = require("./helpers/loadGmeaModule.cjs");

function elements(node) {
  return React.isValidElement(node) ? [node, ...React.Children.toArray(node.props.children).flatMap(elements)] : [];
}

function createQueueHarness(kind) {
  const rows = Array.from({ length: 28 }, (_, index) => ({
    id: `request-${index}`, employee_name: `Employee ${index}`, site_name: "Site A", period_label: "October 1–15",
    created_at: `2026-10-01T${String(index % 24).padStart(2, "0")}:00:00Z`,
    status: index % 2 ? "approved" : "pending", quantity: 3, amount: 300, notes: null,
    payroll_runs: null, requester_role: "employee", request_date: "2026-10-01", overtime_hours: 3, reason: "Site turnover",
  }));
  const calls = [];
  const states = [];
  let cursor = 0;
  const hooks = { ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], value => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
    },
    useEffect() {}, useMemo: callback => callback(), useTransition: () => [false, callback => callback()],
  };
  const mocks = {
    react: hooks,
    "@/components/workspace/workspace.module.css": { default: {} },
    "@/features/ceo-workspace/components/CeoListToolbar": { default: () => null },
    "@/features/ceo-workspace/components/CeoListPagination": { default: () => null },
    "@/features/payroll/components/PayrollApprovalEmployeeLogsModal": { default: () => null },
    "@/features/payroll/hooks/usePayrollApprovalQueue": { usePayrollApprovalQueue: () => ({
      pendingRequests: rows, pendingCount: 14, isPending: false, pendingActionId: null, pendingActionType: null,
      employeeLogsLoadingByRequestId: {}, activeLogsModalState: null,
      openRequestLogs: request => calls.push(["logs", request.id]),
      handleAction: (id, type) => calls.push([type, id]),
    }) },
    "@/actions/payroll": { approveOvertimeRequestFormAction() {}, rejectOvertimeRequestFormAction() {} },
  };
  const path = kind === "payroll" ? "PayrollApprovalQueue" : "OvertimeRequestApprovalQueue";
  const Queue = load(`features/payroll/components/${path}.tsx`, mocks).default;
  return { rows, calls, render() {
    cursor = 0;
    const nodes = elements(Queue({ role: "ceo", initialRequests: rows }));
    return {
      table: nodes.find(node => node.props.requests),
      pager: nodes.find(node => node.props.onPageSizeChange),
      toolbar: nodes.find(node => node.props.searchLabel),
    };
  } };
}

for (const kind of ["payroll", "staff"]) {
  test(`${kind} approval table paginates independently and resets search, status and page size`, () => {
    const harness = createQueueHarness(kind);
    let view = harness.render();
    const allIds = view.table.props.requests.map(row => row.id);
    assert.equal(view.table.props.requests.length, 10);
    assert.equal(view.pager.props.totalPages, 3);
    view.pager.props.onPageChange(3);
    view = harness.render();
    assert.equal(view.table.props.requests.length, 8);
    assert.ok(view.table.props.requests.every(row => !allIds.includes(row.id)));
    view.toolbar.props.onQueryChange("Employee 27");
    view = harness.render();
    assert.equal(view.pager.props.page, 1);
    assert.deepEqual(view.table.props.requests.map(row => row.id), ["request-27"]);
    view.toolbar.props.onTabChange("pending");
    view = harness.render();
    assert.equal(view.table.props.requests.length, 0);
    view.toolbar.props.onReset();
    view = harness.render();
    view.pager.props.onPageSizeChange(25);
    view = harness.render();
    assert.equal(view.pager.props.page, 1);
    assert.equal(view.table.props.requests.length, 25);
    view.pager.props.onPageChange(2);
    view = harness.render();
    assert.equal(view.table.props.requests.length, 3);
    assert.equal(harness.rows.length, 28);
  });
}

test("payroll table actions target the selected page's request and resolved records cannot be approved", () => {
  const harness = createQueueHarness("payroll");
  harness.render().pager.props.onPageChange(3);
  const view = harness.render();
  const nodes = elements(view.table.type(view.table.props));
  nodes.find(node => node.type === "button" && node.props["aria-label"] === "Approve overtime request for Employee 20").props.onClick();
  nodes.find(node => node.type === "button" && node.props.children === "View Employee Logs").props.onClick();
  assert.deepEqual(harness.calls, [["approve", "request-20"], ["logs", "request-20"]]);
  assert.equal(nodes.filter(node => node.type === "button" && node.props["aria-label"] === "Approve overtime request for Employee 21").length, 0);
});

test("staff table shows complete reasons and return notes and preserves request IDs in actions", () => {
  const calls = [];
  const Table = load("features/payroll/components/StaffOvertimeRequestsTable.tsx", {
    "@/components/workspace/workspace.module.css": { default: {} },
  }).default;
  const requests = [{ id: "staff-a", employee_name: "Ana", requester_role: "employee", site_name: "Site A", period_label: "October",
    request_date: "2026-10-01", overtime_hours: 3.5, amount: 0, reason: "Finish the site turnover", rejection_reason: null,
    status: "pending", created_at: "2026-10-01T08:00:00Z" },
    { id: "staff-b", employee_name: "Ben", requester_role: "engineer", site_name: "Site B", request_date: "2026-10-02", overtime_hours: 2,
      amount: 0, reason: "Complete inspection", rejection_reason: "Confirm the schedule", status: "rejected", created_at: "2026-10-02T08:00:00Z" }];
  const tree = Table({ requests, pending: false, approvingId: null, onApprove: id => calls.push(["approve", id]), onReject: id => calls.push(["return", id]) });
  const html = renderToStaticMarkup(tree);
  assert.match(html, /Finish the site turnover/);
  assert.match(html, /Confirm the schedule/);
  assert.match(html, /3.5/);
  const buttons = elements(tree).filter(node => node.type === "button");
  assert.equal(buttons.length, 2);
  buttons[0].props.onClick(); buttons[1].props.onClick();
  assert.deepEqual(calls, [["return", "staff-a"], ["approve", "staff-a"]]);
});

test("queue tabs retain both tables and update pending totals after decisions", () => {
  const states = [];
  let cursor = 0;
  const Page = load("features/payroll/components/OvertimeApprovalsPageClient.tsx", {
    react: { ...React, useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], value => { states[index] = value; }];
    } },
    "@/components/workspace/WorkspaceTabSwitch": { default: () => null },
    "@/features/payroll/components/PayrollApprovalQueue": { default: () => null },
    "@/features/payroll/components/OvertimeRequestApprovalQueue": { default: () => null },
    "./OvertimeApprovalsHero": { default: () => null },
  }).default;
  const payroll = [{ status: "pending" }, { status: "approved" }];
  const staff = [{ status: "pending" }, { status: "pending" }];
  function render() {
    cursor = 0;
    const nodes = elements(Page({ initialRequests: payroll, initialOvertimeRequests: staff }));
    return {
      tabs: nodes.find(node => node.props.panelId),
      hero: nodes.find(node => node.props.pending !== undefined),
      queues: nodes.filter(node => node.props.onPendingCountChange),
      visibility: nodes.filter(node => node.props.hidden !== undefined).map(node => node.props.hidden),
    };
  }
  let view = render();
  assert.equal(view.hero.props.pending, 3);
  assert.deepEqual(view.visibility, [false, true]);
  assert.equal(view.queues.length, 2);
  view.tabs.props.onChange("staff");
  view = render();
  assert.deepEqual(view.visibility, [true, false]);
  assert.equal(view.queues[0].props.initialRequests, payroll);
  assert.equal(view.queues[1].props.initialRequests, staff);
  view.queues[1].props.onPendingCountChange(1);
  view = render();
  assert.equal(view.hero.props.pending, 2);
  assert.deepEqual(view.tabs.props.items.map(item => item.count), [1, 1]);
  view.tabs.props.onChange("payroll");
  view = render();
  assert.deepEqual(view.visibility, [false, true]);
  assert.equal(view.hero.props.pending, 2);
});
