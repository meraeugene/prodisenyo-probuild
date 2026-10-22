const assert = require("node:assert/strict");

module.exports = async function checkGmeaAccessibility(page, base) {
  const modal = page.getByRole("dialog");
  const cases = ["project-create", "project-edit", "project-expense", "project-contract", "project-payment", "project-void", "project-partners",
    "rental-income", "rental-expense-entry", "rental-expense", "rental-week-expense", "equipment", "booking", "rental-payment", "rental-void", "worker", "assignment", "operation-expense"];
  async function open(name) {
    await page.goto(`${base}/gmea-modal-validation?case=${name}&launch=button`);
    const opener = page.getByRole("button", { name: "Open test dialog", exact: true });
    await opener.focus(); await opener.press("Enter");
    await modal.waitFor();
    return opener;
  }
  for (const name of cases) {
    const opener = await open(name);
    assert.equal(await modal.evaluate(element => {
      const title = document.getElementById(element.getAttribute("aria-labelledby"));
      const description = document.getElementById(element.getAttribute("aria-describedby"));
      return Boolean(title?.textContent.trim() && description?.textContent.trim() && element.contains(document.activeElement));
    }), true, `${name} is named, described, and receives keyboard focus`);
    for (const field of await modal.locator("input,select,textarea").all()) {
      assert.equal(await field.evaluate(element => Boolean(element.getAttribute("aria-label") || element.labels?.length)), true, `${name} labels every form control`);
    }
    // Tab and Shift+Tab remain within the modal (including the final action).
    const close = modal.getByRole("button", { name: "Close dialog", exact: true });
    await close.focus(); await close.press("Shift+Tab");
    assert.equal(await modal.evaluate(element => element.contains(document.activeElement)), true, `${name} traps reverse tab`);
    await page.keyboard.press("Tab");
    assert.equal(await modal.evaluate(element => element.contains(document.activeElement)), true, `${name} traps forward tab`);
    await close.focus(); await page.keyboard.press("Escape");
    await modal.waitFor({ state: "hidden" });
    assert.equal(await opener.evaluate(element => document.activeElement === element), true, `${name} restores its opener after Escape`);
    assert.equal(await page.evaluate(() => window.__gmeaMutationCalls || 0), 0, `${name} Escape does not submit`);
    console.log(`Keyboard accessibility passed: ${name}`);
  }

  const fields = [
    ["project-expense", "Amount (PHP) *"], ["project-expense", "Refunded Sir Edward (PHP)"],
    ["project-contract", "Contract amount (PHP) *"], ["project-payment", "Paid amount (PHP) *"],
    ["rental-income", "Total amount *"], ["rental-income", "Down payment"], ["rental-income", "Full payment"],
    ["rental-expense-entry", "Amount *"], ["rental-expense", "Amount *"], ["rental-expense", "Refunded amount"],
    ["rental-week-expense", "Amount *"], ["equipment", "Default rate"], ["booking", "Rate *"],
    ["rental-payment", "Amount received (PHP) *"], ["operation-expense", "Amount *"],
  ];
  for (const [name, label] of fields) {
    await open(name);
    const field = modal.getByLabel(label, { exact: true });
    await field.fill("1234567.89");
    assert.equal(await field.inputValue(), "1,234,567.89", `${name}: ${label} groups while typing`);
    await field.fill("9,876.5"); await field.press("Tab");
    assert.equal(await field.inputValue(), "9,876.50", `${name}: ${label} accepts formatted paste and pads cents`);
  }

  // Check typing/caret behavior through commas and ensure the stored amount is numeric.
  await page.goto(base + "/gmea-operation-expenses");
  const opener = page.getByRole("button", { name: "New operation expense", exact: true });
  await opener.click();
  const amount = modal.getByLabel("Amount *", { exact: true });
  await amount.fill(""); await amount.pressSequentially("12345.67");
  assert.equal(await amount.inputValue(), "12,345.67");
  await amount.evaluate(element => element.setSelectionRange(3, 3)); await amount.press("Backspace");
  assert.equal(await amount.inputValue(), "1,345.67", "Backspace skips the grouping comma");
  await amount.fill("1234");
  await amount.evaluate(element => element.setSelectionRange(1, 1)); await amount.press("Delete");
  assert.equal(await amount.inputValue(), "134", "Delete skips the grouping comma");
  await amount.fill("1,234.56");
  await modal.getByLabel("Description *", { exact: true }).fill("Accessible money entry");
  await modal.getByRole("button", { name: "Save and add again", exact: true }).click();
  await page.waitForFunction(() => document.querySelector("[role=dialog] input[data-money-input]")?.value === "");
  assert.equal(await page.evaluate(() => window.__savedOperationExpense.amount), 1234.56);
  await page.keyboard.press("Escape"); await modal.waitFor({ state: "hidden" });
  assert.equal(await opener.evaluate(element => document.activeElement === element), true, "Repeat entry preserves the original opener");

  // Escape dismisses a suggestion list before dismissing its owning dialog.
  await opener.click();
  const payee = modal.getByLabel("Payee / supplier", { exact: true });
  await payee.focus(); await page.getByRole("listbox").waitFor();
  await payee.press("Escape");
  await page.getByRole("listbox").waitFor({ state: "hidden" });
  assert.equal(await modal.isVisible(), true);
  await payee.press("Escape"); await modal.waitFor({ state: "hidden" });

  const deletion = page.getByRole("button", { name: "Delete", exact: true }).first();
  await deletion.click();
  const confirm = page.getByRole("alertdialog"); await confirm.waitFor();
  await page.keyboard.press("Escape"); await confirm.waitFor({ state: "hidden" });
  assert.equal(await deletion.evaluate(element => document.activeElement === element), true, "Delete confirmation restores focus");

  await page.goto(base + "/gmea-operation-expenses?role=ceo");
  const details = page.getByRole("button", { name: "Details", exact: true }).first();
  await details.click(); await page.keyboard.press("Escape"); await modal.waitFor({ state: "hidden" });
  assert.equal(await details.evaluate(element => document.activeElement === element), true, "Read-only details close with Escape");

  await page.setViewportSize({ width: 390, height: 844 });
  await open("rental-income");
  assert.equal(await modal.evaluate(element => element.scrollWidth <= element.clientWidth), true);
  await page.keyboard.press("Escape"); await modal.waitFor({ state: "hidden" });
};
