const assert = require("node:assert/strict");
const path = require("node:path");

module.exports = async function checkGmeaSavedInputs(page, base, screenshots) {
  const supplier = "Reusable supplier", method = "Custom bank method";
  await page.goto(base + "/gmea-operation-expenses");
  await page.getByRole("button", { name: "New operation expense", exact: true }).click();
  const modal = page.getByRole("dialog");
  await modal.getByLabel("Description *", { exact: true }).fill("Reusable choices check");
  await modal.getByLabel("Amount *", { exact: true }).fill("1");
  await modal.getByLabel("Payee / supplier", { exact: true }).fill(supplier);
  await modal.getByLabel("Mode of payment", { exact: true }).fill(method);
  await modal.getByRole("button", { name: "Save expense", exact: true }).click();
  await modal.waitFor({ state: "hidden" });
  const saved = await page.evaluate(() => JSON.parse(sessionStorage.getItem("gmea-saved-input-options")));
  assert.ok(saved.suppliers.includes(supplier) && saved.methods.includes(method));

  await page.goto(base + "/gmea-rentals/income");
  await page.getByRole("button", { name: "Rental expense", exact: true }).click();
  await modal.getByLabel("Supplier / payee", { exact: true }).fill("Reus");
  await page.getByRole("option", { name: supplier, exact: true }).click();
  assert.equal(await modal.getByLabel("Supplier / payee", { exact: true }).inputValue(), supplier);
  await modal.getByLabel("Payment method", { exact: true }).fill("Custom");
  await page.getByRole("option", { name: method, exact: true }).click();
  assert.equal(await modal.getByLabel("Payment method", { exact: true }).inputValue(), method);
  await modal.getByLabel("Supplier / payee", { exact: true }).fill("Reus");
  await page.getByRole("listbox", { name: "Supplier / payee options", exact: true }).waitFor();
  await page.screenshot({ path: path.join(screenshots, "gmea-saved-dropdown-rentals.png"), fullPage: true });
  await modal.getByLabel("Supplier / payee", { exact: true }).press("Escape");
  assert.equal(await modal.isVisible(), true, "Escape closes suggestions before the dialog");
  await modal.getByRole("button", { name: "Close dialog", exact: true }).click();

  await page.goto(base + "/gmea-project");
  await page.getByRole("button", { name: "Expenses", exact: true }).click();
  await page.getByRole("button", { name: "New expense", exact: true }).click();
  await modal.getByLabel("Supplier / vendor", { exact: true }).fill("Reus");
  await page.getByRole("option", { name: supplier, exact: true }).click();
  await modal.getByLabel("Payment method *", { exact: true }).fill("Custom");
  await page.getByRole("option", { name: method, exact: true }).click();
  assert.equal(await modal.getByLabel("Payment method *", { exact: true }).inputValue(), method);
  await modal.getByLabel("Invoice issued to", { exact: true }).fill("GMEA");
  await page.getByRole("option", { name: "GMEA MARKETING CORP.", exact: true }).click();
  await page.screenshot({ path: path.join(screenshots, "gmea-saved-dropdown-projects.png"), fullPage: true });
  await modal.getByRole("button", { name: "Cancel", exact: true }).click();

  await page.goto(base + "/gmea-rentals/income");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Rental expense", exact: true }).click();
  await modal.getByLabel("Payment method", { exact: true }).fill("Custom");
  const popup = page.getByRole("listbox", { name: "Payment method options", exact: true });
  await popup.waitFor();
  const box = await popup.boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= 390 && box.y >= 0 && box.y + box.height <= 844, "Search suggestions fit the mobile viewport");
  await page.screenshot({ path: path.join(screenshots, "gmea-saved-dropdown-mobile.png"), fullPage: true });
  await page.getByRole("option", { name: method, exact: true }).click();
  await modal.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1100 });
};
