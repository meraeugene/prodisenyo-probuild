const assert = require("node:assert/strict");
const path = require("node:path");

module.exports = async function checkBoqItemDialog(page, screenshots) {
  const dialog = page.getByRole("dialog", { name: "Add BOQ item", exact: true });
  const field = name => name === "Catalog Item"
    ? dialog.locator("input[data-search-field]")
    : dialog.getByRole("textbox", { name, exact: false });
  await page.setViewportSize({ width: 1366, height: 768 });
  await field("Description").fill("Steel beam");
  await field("Catalog Item").fill("Portland cement");
  await field("Quantity").fill("2");
  await dialog.getByRole("button", { name: "Add cost line", exact: true }).click();
  assert.equal(await dialog.getByRole("combobox", { name: "Cost line", exact: true }).inputValue(), "1");
  await field("Catalog Item").fill("Delivery");
  await dialog.getByRole("combobox", { name: "Unit", exact: false }).selectOption({ index: 1 });
  await field("Quantity").fill("3");
  await field("Unit Cost").fill("100");
  await dialog.getByRole("combobox", { name: "Pricing Basis", exact: true }).selectOption("supplier_quote");
  await field("Supplier").waitFor();
  await dialog.getByRole("combobox", { name: "Cost line", exact: true }).selectOption("0");
  assert.equal(await field("Quantity").inputValue(), "2", "Switching cost lines retains values");
  await field("Description").fill("");
  await dialog.getByRole("button", { name: "Save item", exact: true }).click();
  await dialog.getByText("Description is required.", { exact: true }).waitFor();
  await field("Description").fill("Steel beam");
  await dialog.getByRole("button", { name: "Save item", exact: true }).click();
  assert.equal(await dialog.getByRole("combobox", { name: "Cost line", exact: true }).inputValue(), "1", "Validation selects the incomplete supplier quote");
  await dialog.getByText("Supplier is required.", { exact: true }).waitFor();
  await field("Supplier").fill("Local supplier");
  await field("Quotation Reference").fill("Q-100");

  for (const [width, height] of [[1440, 900], [1366, 768], [768, 1024], [390, 844]]) {
    await page.setViewportSize({ width, height });
    if (width < 680) await dialog.getByRole("button", { name: "Cost lines", exact: true }).click();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const metrics = await dialog.evaluate(element => {
      const body = element.querySelector('[class*="dialogBody"]');
      const bounds = element.getBoundingClientRect();
      return { width: bounds.width, bottom: bounds.bottom, bodyHeight: body.clientHeight, bodyScroll: body.scrollHeight, horizontalOverflow: element.scrollWidth > element.clientWidth };
    });
    assert.ok(metrics.bodyScroll <= metrics.bodyHeight + 1, `BOQ item body has no scroll at ${width}x${height}`);
    assert.ok(metrics.bottom <= height && !metrics.horizontalOverflow, "Modal fields and footer fit");
    if (width >= 1100) assert.ok(metrics.width <= 1120, "BOQ item keeps a compact desktop width");
    assert.equal(await field("Supplier").inputValue(), "Local supplier");
    await page.screenshot({ path: path.join(screenshots, `engineer-boq-columns-${width}.png`) });
    if (width < 680) {
      await dialog.getByRole("button", { name: "Summary", exact: true }).click();
      await dialog.getByText("This Item Total", { exact: true }).waitFor();
      await dialog.getByRole("button", { name: "Item details", exact: true }).click();
      assert.equal(await field("Description").inputValue(), "Steel beam");
    }
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
};
