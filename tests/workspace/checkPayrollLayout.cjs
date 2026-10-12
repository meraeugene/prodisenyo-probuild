const assert = require("node:assert/strict");
const path = require("node:path");

module.exports = async function checkPayrollLayout(page, base, screenshots) {
  await page.setViewportSize({ width: 1440, height: 782 });
  await page.goto(`${base}/generate-payroll`);
  const table = page.locator("[data-payroll-records-panel] table");
  await table.waitFor();
  const search = page.getByRole("searchbox", { name: "Search payroll employees" });
  await search.pressSequentially("Employee 05");
  await page.waitForFunction(() => {
    const rows = document.querySelectorAll("[data-payroll-records-panel] table tbody tr");
    return rows.length === 1 && rows[0].textContent.includes("Employee 05");
  });
  await page.getByRole("button", { name: "Clear Filters", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll("[data-payroll-records-panel] table tbody tr").length === 5);
  const widths = await table.evaluate(element => [...element.querySelectorAll("th")].map(cell => ({
    client: cell.clientWidth, scroll: cell.scrollWidth,
  })));
  assert.ok(widths.every(cell => cell.scroll <= cell.client), "All column headers fit without clipping");
  assert.ok(widths.at(-1).client >= 80, "Actions column has room for its heading and button");
  await page.screenshot({ path: path.join(screenshots, "payroll-table-layout.png") });

  await page.getByRole("button", { name: "Rates", exact: true }).click();
  const rates = page.getByRole("dialog", { name: "Edit Employee Rates Per Branch" });
  await rates.waitFor();
  const all = await rates.getByRole("button", { name: "All Employees", exact: true }).boundingBox();
  const multi = await rates.getByRole("button", { name: "Multi-branch Only", exact: true }).boundingBox();
  assert.ok(Math.abs(all.y - multi.y) < 1 && all.height === multi.height, "Branch filter buttons align on one row");
  await rates.locator('input[type="text"]').focus();
  await page.screenshot({ path: path.join(screenshots, "payroll-rate-layout.png") });
  await page.keyboard.press("Escape");
  await rates.waitFor({ state: "detached" });
  await page.getByRole("button", { name: "Paid Holidays", exact: true }).click();
  await page.getByRole("heading", { name: "Paid Holidays", exact: true }).waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("heading", { name: "Paid Holidays", exact: true }).waitFor({ state: "detached" });

  for (const viewport of [{ width: 1440, height: 782 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const actions = page.getByRole("button", { name: /actions for Employee 01/i }).first();
    await actions.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await actions.click();
    await page.getByRole("menuitem", { name: "Edit employee", exact: true }).click();
    const calculation = page.getByRole("dialog", { name: "Employee calculation details", exact: true });
    await calculation.waitFor();
    const pagination = calculation.getByRole("navigation", { name: "Employee detail pages" });
    await pagination.waitFor();
    const original = await pagination.boundingBox();
    const modal = await calculation.boundingBox();
    assert.ok(original.y >= modal.y && original.y + original.height <= modal.y + modal.height, "Pagination is visible inside modal before scrolling");
    assert.equal(await pagination.evaluate(element => element.closest('[role="tabpanel"]') === null), true);
    const panel = calculation.getByRole("tabpanel");
    await panel.evaluate(element => { element.scrollTop = element.scrollHeight; });
    const scrolled = await pagination.boundingBox();
    assert.equal(original.y, scrolled.y, "Pagination stays pinned while table scrolls");
    await pagination.getByRole("button", { name: "Page 2", exact: true }).click();
    await panel.getByText("6/Tue", { exact: true }).waitFor();
    await calculation.getByRole("tab", { name: "Adjustment Breakdown", exact: true }).click();
    await calculation.getByRole("button", { name: "Cash Advance", exact: true }).click();
    const adjustment = page.getByRole("dialog", { name: "Cash Advance", exact: true });
    await adjustment.locator('input[type="number"]').focus();
    await page.keyboard.press("Escape");
    await adjustment.waitFor({ state: "detached" });
    assert.equal(await calculation.isVisible(), true, "Escape closes only the nested dialog");
    await calculation.getByRole("tab", { name: "Cutoff Attendance", exact: true }).click();
    await page.screenshot({ path: path.join(screenshots, `payroll-pagination-${viewport.width}.png`) });
    await page.keyboard.press("Escape");
    await calculation.waitFor({ state: "detached" });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  }
};
