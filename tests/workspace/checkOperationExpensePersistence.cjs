const assert = require('node:assert/strict');

module.exports = async function checkOperationExpensePersistence(page, base) {
  await page.addInitScript(() => {
    window.__gateReads = true;
    window.__gmeaActionGate = name => {
      if (name === 'getGmeaOperationExpensesAction' && window.__gateReads)
        return new Promise(resolve => (window.__releaseReads ||= []).push(resolve));
      if (name === 'saveGmeaOperationExpenseAction' || name === 'deleteGmeaOperationExpenseAction' || name === 'saveGmeaProjectAction')
        return new Promise(resolve => { window.__releaseMutation = resolve; });
    };
  });
  await page.goto(base + '/gmea-operation-expenses');
  const report = page.getByRole('region', { name: 'Operation expense reporting', exact: true });
  const dialog = page.getByRole('dialog');
  const originals = await report.locator('tbody th').allTextContents();
  assert.equal(originals.length, 3);

  async function spinner(modal, label) {
    const active = modal.getByRole('button', { name: label, exact: true });
    await active.locator('svg.animate-spin').waitFor();
    assert.equal(await active.getAttribute('aria-busy'), 'true');
    assert.equal(await modal.locator('button svg.animate-spin').count(), 1);
    assert.equal(await modal.getByRole('button', { name: 'Cancel', exact: true }).isDisabled(), true);
    await page.keyboard.press('Escape');
    assert.equal(await modal.isVisible(), true, 'An in-flight write cannot be dismissed');
  }
  async function fill(description, amount) {
    await dialog.getByLabel('Date *', { exact: true }).fill('2026-10-06');
    await dialog.getByLabel('Description *', { exact: true }).fill(description);
    await dialog.getByLabel('Amount *', { exact: true }).fill(amount);
  }
  async function releaseReads() {
    await page.evaluate(() => { window.__gateReads = false; window.__releaseReads.splice(0).forEach(resolve => resolve()); });
  }
  await page.getByRole('button', { name: 'New operation expense', exact: true }).click();
  await fill('First additional expense', '100');
  await dialog.getByRole('button', { name: 'Save and add again', exact: true }).click();
  await spinner(dialog, 'Saving and adding again…');
  assert.equal(await dialog.getByRole('button', { name: 'Save expense', exact: true }).isDisabled(), true);
  await page.evaluate(() => window.__releaseMutation());
  // The open modal hides the background table from the accessibility tree.
  await report.locator('tbody th').filter({ hasText: 'First additional expense' }).waitFor();
  for (const original of originals) assert.ok((await report.innerText()).includes(original), 'Saving before the initial fetch completes preserves existing expenses');
  const firstId = await page.evaluate(() => window.__savedOperationExpense.id);
  // A repeat entry must be ready even while the initial list read is still held.
  await page.waitForFunction(() => document.querySelector('[role="dialog"] input[data-money-input]')?.value === '');
  await releaseReads();

  await fill('Second additional expense', '50');
  await dialog.getByRole('button', { name: 'Save expense', exact: true }).click();
  await spinner(dialog, 'Saving…');
  assert.equal(await dialog.getByRole('button', { name: 'Save and add again', exact: true }).isDisabled(), true);
  await page.evaluate(() => window.__releaseMutation());
  await dialog.waitFor({ state: 'hidden' });
  assert.notEqual(await page.evaluate(() => window.__savedOperationExpense.id), firstId);
  assert.equal(await report.locator('tbody tr').count(), 5);
  assert.match(await report.innerText(), /First additional expense/);
  assert.match(await report.innerText(), /Second additional expense/);
  assert.equal(await page.evaluate(() => window.__operationExpenses.length), 7);

  // Reopening and saving another operation must also retain both preceding entries.
  await page.getByRole('button', { name: 'New operation expense', exact: true }).click();
  await fill('Failed expense', '25');
  await page.evaluate(() => { window.__failOperationSave = true; });
  await dialog.getByRole('button', { name: 'Save expense', exact: true }).click();
  await spinner(dialog, 'Saving…');
  await page.evaluate(() => window.__releaseMutation());
  await dialog.getByText('Operation expense could not be saved.', { exact: true }).waitFor();
  assert.equal(await dialog.locator('svg.animate-spin').count(), 0);
  assert.equal(await dialog.getByLabel('Description *', { exact: true }).inputValue(), 'Failed expense');
  assert.equal(await page.evaluate(() => window.__operationExpenses.length), 7);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();

  await report.getByRole('button', { name: 'Delete', exact: true }).first().click();
  const confirm = page.getByRole('alertdialog');
  await confirm.getByRole('button', { name: 'Delete', exact: true }).click();
  await spinner(confirm, 'Deleting…');
  await page.evaluate(() => window.__releaseMutation());
  await confirm.waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => window.__operationExpenses.length), 6);

  // Project modals use the same independent action feedback.
  await page.goto(base + '/gmea-modal-validation?case=project-expense');
  await dialog.getByLabel('Description / items *', { exact: true }).fill('Copper wire');
  await dialog.getByLabel('Amount (PHP) *', { exact: true }).fill('100');
  await dialog.getByLabel('Payment method *', { exact: true }).fill('Cash');
  await page.getByRole('option', { name: 'Cash', exact: true }).click();
  await dialog.getByRole('button', { name: 'Save and add again', exact: true }).click();
  await spinner(dialog, 'Saving and adding again…');
  await page.evaluate(() => window.__releaseMutation());
  await page.waitForFunction(() => document.getElementById('expense-item-0')?.value === '');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
};
