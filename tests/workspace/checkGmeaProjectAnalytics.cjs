const assert = require("node:assert/strict");
const path = require("node:path");

module.exports = async function checkGmeaProjectAnalytics(page, base, screenshots) {
  for (const role of ["gmea", "ceo"]) {
    await page.goto(base + "/gmea-projects?role=" + role);
    const views = page.getByRole("navigation", { name: "GMEA project views", exact: true });
    const records = page.getByRole("region", { name: role === "ceo" ? "Projects" : "GMEA project records", exact: true });
    const analytics = page.getByRole("region", { name: "GMEA project analytics", exact: true });
    await records.locator("tbody tr").first().waitFor();
    assert.equal(await analytics.count(), 0);
    assert.equal(await page.locator(".recharts-surface").count(), 0);
    await records.getByRole("button", { name: /all projects/i }).click();
    assert.equal(await records.locator("tbody tr").count(), 5);
    await records.getByRole("button", { name: "Next page", exact: true }).click();
    assert.equal(await records.getByRole("button", { name: "Page 2", exact: true }).getAttribute("aria-current"), "page");
    await views.getByRole("button", { name: "Analytics", exact: true }).click();
    await analytics.getByRole("heading", { name: "Contract vs Expenses Trend", exact: true }).waitFor();
    await analytics.locator(".recharts-surface").first().waitFor();
    assert.equal(await analytics.locator(".recharts-surface").count(), 2);
    assert.equal(await records.count(), 0);
    await analytics.getByRole("heading", { name: "Collection Status", exact: true }).waitFor();
    await analytics.getByRole("combobox", { name: "Chart period", exact: true }).selectOption("12");
    assert.equal(await analytics.getByRole("combobox", { name: "Chart period", exact: true }).inputValue(), "12");
    await views.getByRole("button", { name: "Projects", exact: true }).click();
    assert.equal(await analytics.count(), 0);
    assert.equal(await records.getByRole("button", { name: "Page 2", exact: true }).getAttribute("aria-current"), "page");
    await records.getByRole("searchbox", { name: "Search projects", exact: true }).fill("Harbor");
    assert.equal(await records.locator("tbody tr").count(), 1);
    const filteredTotals = await records.locator("tfoot").innerText();
    await views.getByRole("button", { name: "Analytics", exact: true }).click();
    assert.equal(await analytics.getByRole("combobox", { name: "Chart period", exact: true }).inputValue(), "12");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(screenshots, role + "-gmea-project-analytics-desktop.png"), fullPage: true });
    await views.getByRole("button", { name: "Projects", exact: true }).click();
    assert.equal(await records.getByRole("searchbox", { name: "Search projects", exact: true }).inputValue(), "Harbor");
    assert.equal(await records.locator("tfoot").innerText(), filteredTotals);
    assert.equal(await page.getByRole("button", { name: "New project", exact: true }).count(), role === "gmea" ? 1 : 0);
    await views.getByRole("button", { name: "Analytics", exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, role + " project analytics mobile overflow");
    await analytics.locator(".recharts-surface").first().waitFor();
    await page.screenshot({ path: path.join(screenshots, role + "-gmea-project-analytics-mobile.png"), fullPage: true });
    await views.getByRole("button", { name: "Projects", exact: true }).click();
    assert.equal(await records.locator("tbody tr").count(), 1);
    await page.setViewportSize({ width: 1440, height: 1100 });
  }
};
