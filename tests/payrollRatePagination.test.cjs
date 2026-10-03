const assert = require('node:assert/strict');
const test = require('node:test');
const React = require('react');
const load = require('./helpers/loadGmeaModule.cjs');

function elements(node) {
  if (!React.isValidElement(node)) return [];
  return [node, ...React.Children.toArray(node.props.children).flatMap(elements)];
}

test('branch rate pagination keeps edits across pages and resets search and filters', () => {
  const states = [];
  let cursor = 0;
  const Modal = load('features/payroll/components/PayrollRateModal.tsx', {
    react: {
      ...React,
      useState(initial) {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        return [states[index], value => { states[index] = value; }];
      },
      useMemo: callback => callback(),
      useTransition: () => [false, callback => callback()],
    },
    '@/actions/payrollRates': { saveEmployeeBranchRatesAction: async () => ({ saved: 1 }) },
    sonner: { toast: {} },
  }).default;
  const payroll = {
    showPayrollRateModal: true,
    payrollBaseComputedRows: Array.from({ length: 12 }, (_, index) => ({
      worker: `Employee ${String(index + 1).padStart(2, '0')}`,
      role: 'worker', site: 'Branch A', defaultRate: 62.5,
    })),
    payrollRateDraft: {},
    setPayrollRateDraft(update) { this.payrollRateDraft = update(this.payrollRateDraft); },
  };
  function render() { cursor = 0; return elements(Modal({ payroll })); }
  function table(nodes) { return nodes.find(node => node.props.rows); }
  function pager(nodes) { return nodes.find(node => node.props.label === 'Employee branch rate pages'); }
  let nodes = render();
  assert.equal(table(nodes).props.rows.length, 5);
  assert.equal(pager(nodes).props.totalPages, 3);
  const firstKey = table(nodes).props.rows[0].key;
  const input = elements(table(nodes).type(table(nodes).props)).find(node => node.type === 'input');
  input.props.onChange({ target: { value: '650' } });
  pager(nodes).props.onChange(3);
  nodes = render();
  assert.equal(table(nodes).props.rows.length, 2);
  assert.equal(table(nodes).props.rows[0].worker, 'Employee 11');
  pager(nodes).props.onChange(1);
  nodes = render();
  assert.equal(payroll.payrollRateDraft[firstKey].dailyRate, 650);
  assert.equal(elements(table(nodes).type(table(nodes).props)).find(node => node.type === 'input').props.value, 650);
  pager(nodes).props.onChange(3);
  nodes = render();
  nodes.find(node => node.type === 'input').props.onChange({ target: { value: 'Employee 01' } });
  nodes = render();
  assert.equal(pager(nodes).props.page, 1);
  assert.equal(table(nodes).props.rows.length, 1);
  nodes.find(node => node.type === 'button' && node.props.children === 'Multi-branch Only').props.onClick();
  nodes = render();
  assert.equal(pager(nodes).props.page, 1);
  assert.equal(table(nodes).props.rows.length, 0);
});
