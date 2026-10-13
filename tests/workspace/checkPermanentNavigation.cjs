const assert = require("node:assert/strict");
const path = require("node:path");

module.exports = async function checkPermanentNavigation(page, base, screenshots) {
  page.setDefaultTimeout(10000);
  const links = [["Rentals", "income"]];
  for (const role of ["ceo", "gmea"]) {
    for (const route of ["/gmea-projects", "/gmea-rentals/expenses", "/budget-tracker"]) {
      await page.goto(`${base}${route}?role=${role}`);
      await page.locator("[data-workspace-header]").waitFor();
      const sidebar = page.locator("#dashboard-sidebar");
      const nav = page.getByRole("navigation", { name: "Main navigation", exact: true });
      assert.equal(await sidebar.evaluate(element => element.getBoundingClientRect().width), 248, `${role} sidebar stays full width on ${route}`);
      assert.equal(await sidebar.getByRole("button", { name: /^(Collapse|Expand) navigation$/ }).count(), 0);
      assert.equal(await nav.locator("button[aria-expanded]").count(), 0, `${role} has no expandable menu`);
      assert.equal(await nav.getByRole("link", { name: /^(Operation Expense|Rental Bookings|Equipment|Rental Expenses)$/ }).count(), 0);
      for (const [label, destination] of links) {
        const link = nav.getByRole("link", { name: label, exact: true });
        assert.equal(await link.isVisible(), true);
        assert.equal(await link.getAttribute("href"), `/gmea-rentals/${destination}`);
      }
      if (route.endsWith("expenses")) assert.equal(await nav.getByRole("link", { name: "Rentals", exact: true }).getAttribute("aria-current"), "page");
    }
    await page.goto(`${base}/gmea-projects?role=${role}`);
    await page.locator("[data-workspace-header]").waitFor();
    await page.screenshot({ path: path.join(screenshots, `${role}-static-sidebar-desktop.png`), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    for (const [label] of links) assert.equal(await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name: label, exact: true }).isVisible(), true);
    await page.screenshot({ path: path.join(screenshots, `${role}-static-sidebar-mobile.png`) });
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("button", { name: "Open navigation", exact: true }).getAttribute("aria-expanded"), "false");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.setViewportSize({ width: 1440, height: 1100 });
  }
  await page.goto(`${base}/engineer-pages/dashboard`);
  await page.getByRole("button", { name: "Collapse navigation", exact: true }).click();
  assert.equal(await page.locator("#dashboard-sidebar").evaluate(element => element.getBoundingClientRect().width), 72);
};
