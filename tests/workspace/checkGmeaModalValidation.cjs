const assert = require("node:assert/strict");
const path = require("node:path");

module.exports = async function checkGmeaModalValidation(page, base, screenshots) {
  const cases = ["project-create", "project-edit", "project-expense", "project-contract", "project-payment", "project-void", "project-partners",
    "rental-income", "rental-expense-entry", "rental-expense", "rental-week-expense", "equipment", "booking", "rental-payment", "rental-void", "worker", "assignment", "operation-expense"];
  const modal = page.getByRole("dialog");
  const open = async name => {
    await page.goto(`${base}/gmea-modal-validation?case=${name}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await modal.waitFor();
  };
  const submit = async () => {
    const expanded = modal.getByRole("combobox", { expanded: true });
    if (await expanded.count()) await expanded.first().press("Escape");
    const button = modal.locator('button[type="submit"]:not([value="add-again"])').last();
    assert.equal(await button.isVisible(), true);
    // This suite checks submission behavior; avoid animation-frame stability
    // waits that can stall in a background Windows browser.
    await button.click({ force: true });
  };
  for (const name of cases) {
    await open(name);
    assert.equal(await modal.locator("details").count(), 0, `${name} has no hidden form fields`);
    const required = modal.locator('input[required]:not([readonly]):not(:disabled), textarea[required]:not(:disabled)');
    for (const field of await required.all()) await field.fill("");
    await submit();
    await modal.getByRole("alert").first().waitFor();
    const invalid = modal.locator('[aria-invalid="true"]');
    assert.ok(await invalid.count() > 0, `${name} highlights invalid fields`);
    assert.equal(await invalid.first().evaluate(element => getComputedStyle(element).borderColor), "rgb(225, 29, 72)", `${name} uses a red border`);
    assert.equal(await modal.evaluate(element => element.querySelector('[aria-invalid="true"]') === document.activeElement), true, `${name} focuses the first error`);
    assert.equal(await page.evaluate(() => window.__gmeaMutationCalls || 0), 0, `${name} blocks invalid writes`);
    console.log(`Validated GMEA modal: ${name}`);
  }

  await open("equipment");
  await submit();
  await modal.getByLabel("Name *", { exact: true }).fill("  ");
  assert.equal(await modal.getByLabel("Name *", { exact: true }).getAttribute("aria-invalid"), "true");
  await modal.getByLabel("Name *", { exact: true }).fill("Excavator");
  await modal.getByLabel("Type *", { exact: true }).fill("Backhoe");
  await modal.getByLabel("Asset code *", { exact: true }).fill("EQ-NEW");
  await modal.getByLabel("Default rate", { exact: true }).fill("-1");
  await submit();
  assert.equal(await modal.getByLabel("Default rate", { exact: true }).getAttribute("aria-invalid"), "true");
  await modal.getByLabel("Default rate", { exact: true }).fill("0.50");
  await page.waitForFunction(() => !document.querySelector('[aria-invalid="true"]'));
  assert.match(await modal.innerText(), /Plate number\s*\(optional\)/);
  await submit();
  await modal.waitFor({ state: "hidden" });

  await open("rental-income");
  await modal.getByLabel("Company name *", { exact: true }).fill("Validation customer");
  await modal.getByLabel("Location *", { exact: true }).fill("Manila");
  await modal.getByLabel("Total amount *", { exact: true }).fill("1000");
  await modal.getByLabel("Down payment", { exact: true }).fill("1200");
  await submit();
  assert.equal(await modal.getByLabel("Down payment", { exact: true }).getAttribute("aria-invalid"), "true");
  await modal.getByLabel("Down payment", { exact: true }).fill("500");
  await submit();
  assert.equal(await modal.getByLabel("Down payment date", { exact: true }).getAttribute("aria-invalid"), "true");
  await modal.getByLabel("Down payment date", { exact: true }).fill("2099-01-01");
  await submit();
  assert.equal(await modal.getByLabel("Down payment date", { exact: true }).getAttribute("aria-invalid"), "true");
  await modal.getByLabel("Down payment date", { exact: true }).fill("2026-05-01");
  await modal.getByLabel("Mode of payment *", { exact: true }).fill("Cash");
  await page.getByRole("option", { name: "Cash", exact: true }).click();
  await submit();
  await modal.waitFor({ state: "hidden" });
  assert.equal(await page.evaluate(() => window.__savedIncomeInput.down_payment), 500);

  for (const viewport of [{ width: 1440, height: 1100 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await open("rental-expense-entry");
    assert.equal(await modal.getByLabel("OR / invoice number", { exact: true }).isVisible(), true);
    assert.equal(await modal.getByLabel("Notes", { exact: true }).isVisible(), true);
    assert.match(await modal.innerText(), /Notes\s*\(optional\)/);
    await submit();
    await modal.getByRole("alert").waitFor();
    assert.equal(await modal.evaluate(element => element.scrollWidth <= element.clientWidth), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: path.join(screenshots, `gmea-modal-validation-${viewport.width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
};
